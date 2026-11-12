#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Amcom frontend: build and deploy the static SPA to the VPS.
#
# Layout on the server (the Laravel backend also lives under APP_ROOT and is
# never touched):
#
#   /var/www/apps/amcom/              <- APP_ROOT (backend lives here too)
#   └── frontend/                     <- DEPLOY_PATH
#       ├── .amcom-frontend           <- marker: "this folder belongs to the SPA"
#       ├── releases/20261112T101500-ab12cd3/
#       ├── releases/...
#       └── current -> releases/20261112T101500-ab12cd3   (nginx root)
#
# Each deploy uploads into a new release folder, then switches the `current`
# symlink atomically. Visitors never see a half-uploaded site, and rollback is
# just pointing the symlink back.
#
# Usage:
#   scripts/deploy.sh [deploy]          build + upload + activate (default)
#   scripts/deploy.sh rollback [ID]     re-activate the previous (or given) release
#   scripts/deploy.sh releases          list releases on the server
#
# Required env:  DEPLOY_HOST
# Optional env:  DEPLOY_USER (deploy)  DEPLOY_PORT (22)  SSH_KEY_FILE
#                APP_ROOT (/var/www/apps/amcom)  DEPLOY_PATH ($APP_ROOT/frontend)
#                KEEP_RELEASES (5)  SKIP_BUILD (false)  HEALTHCHECK_URL
# -----------------------------------------------------------------------------
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST (VPS hostname or IP)}"
DEPLOY_USER=${DEPLOY_USER:-deploy}
DEPLOY_PORT=${DEPLOY_PORT:-22}
APP_ROOT=${APP_ROOT:-/var/www/apps/amcom}
DEPLOY_PATH=${DEPLOY_PATH:-$APP_ROOT/frontend}
KEEP_RELEASES=${KEEP_RELEASES:-5}
[ "$KEEP_RELEASES" -ge 2 ] 2>/dev/null || { echo "KEEP_RELEASES must be 2 or more (rollback needs the previous release)" >&2; exit 1; }
SKIP_BUILD=${SKIP_BUILD:-false}
HEALTHCHECK_URL=${HEALTHCHECK_URL:-}

APP_ROOT=${APP_ROOT%/}
DEPLOY_PATH=${DEPLOY_PATH%/}
REMOTE="$DEPLOY_USER@$DEPLOY_HOST"
SSH_OPTS=(-p "$DEPLOY_PORT" -o BatchMode=yes -o ConnectTimeout=15)
if [ -n "${SSH_KEY_FILE:-}" ]; then SSH_OPTS+=(-i "$SSH_KEY_FILE"); fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }
remote() { ssh "${SSH_OPTS[@]}" "$REMOTE" "$@"; }

# ---------------------------------------------------------------------------
# Remote helper. Runs on the VPS; every write is confined to DEPLOY_PATH.
# ---------------------------------------------------------------------------
read -r -d '' REMOTE_LIB <<'EOS' || true
set -euo pipefail
DEPLOY_PATH=$1; APP_ROOT=$2; ACTION=$3; ARG=${4:-}; KEEP=${5:-5}
die() { echo "xx $*" >&2; exit 1; }

# Guard rails: never deploy into the backend.
case "$DEPLOY_PATH" in /*) ;; *) die "DEPLOY_PATH must be absolute: $DEPLOY_PATH" ;; esac
case "$DEPLOY_PATH" in *..*) die "DEPLOY_PATH must not contain '..'" ;; esac
[ "$DEPLOY_PATH" != "$APP_ROOT" ] || die "Refusing to deploy into APP_ROOT ($APP_ROOT): the backend lives there. Use a subfolder such as $APP_ROOT/frontend."
case "$DEPLOY_PATH/" in "$APP_ROOT"/*) ;; *) die "DEPLOY_PATH ($DEPLOY_PATH) must be inside $APP_ROOT" ;; esac
for f in artisan composer.json .env; do
  [ ! -e "$DEPLOY_PATH/$f" ] || die "$DEPLOY_PATH/$f exists. That looks like the Laravel backend; refusing to deploy there."
done
if [ -d "$DEPLOY_PATH" ] && [ ! -e "$DEPLOY_PATH/.amcom-frontend" ] && [ -n "$(ls -A "$DEPLOY_PATH" 2>/dev/null)" ]; then
  die "$DEPLOY_PATH is not empty and was not created by this script. Choose another DEPLOY_PATH or empty it by hand."
fi

cd_releases() { mkdir -p "$DEPLOY_PATH/releases"; touch "$DEPLOY_PATH/.amcom-frontend"; cd "$DEPLOY_PATH"; }
current_release() { [ -L "$DEPLOY_PATH/current" ] && basename "$(readlink "$DEPLOY_PATH/current")" || true; }
activate() {
  [ -f "$DEPLOY_PATH/releases/$1/index.html" ] || die "Release $1 has no index.html"
  ln -sfn "releases/$1" "$DEPLOY_PATH/current.tmp"
  mv -Tf "$DEPLOY_PATH/current.tmp" "$DEPLOY_PATH/current"   # atomic switch
  echo "active: $1"
}

case "$ACTION" in
  prepare)
    cd_releases
    [ ! -e "releases/$ARG" ] || die "Release $ARG already exists"
    mkdir "releases/$ARG"
    ;;
  finalize)
    cd_releases
    find "releases/$ARG" -type d -exec chmod 755 {} +
    find "releases/$ARG" -type f -exec chmod 644 {} +
    [ -f "releases/$ARG/index.html" ] || die "Upload incomplete: index.html missing"
    ;;
  activate)
    cd_releases
    current_release > .previous-release
    activate "$ARG"
    # Prune old releases (names sort by time), never the active one.
    # Prune old releases (names sort by time); keep the active and the previously active one.
    active=$(current_release)
    previous=$(cat .previous-release 2>/dev/null || true)
    for old in $(ls -1 releases | sort -r | tail -n +"$((KEEP + 1))"); do
      if [ "$old" != "$active" ] && [ "$old" != "$previous" ]; then rm -rf -- "releases/$old"; echo "pruned: $old"; fi
    done
    ;;
  rollback)
    cd_releases
    target=$ARG
    if [ "$target" = "previous" ]; then
      # Used by the deploy's health check: restore exactly what was live before.
      target=$(cat .previous-release 2>/dev/null || true)
      [ -n "$target" ] || die "No previous release recorded"
    elif [ -z "$target" ]; then
      active=$(current_release)
      target=$(ls -1 releases | sort -r | awk -v a="$active" 'found { print; exit } $0 == a { found = 1 }')
      [ -n "$target" ] || die "No older release to roll back to"
    fi
    activate "$target"
    ;;
  discard)
    cd_releases
    [ -n "$ARG" ] && [ "$ARG" != "$(current_release)" ] && rm -rf -- "releases/$ARG" || true
    ;;
  releases)
    cd_releases
    active=$(current_release)
    for r in $(ls -1 releases | sort -r); do
      if [ "$r" = "$active" ]; then echo "* $r (active)"; else echo "  $r"; fi
    done
    ;;
  *) die "Unknown action $ACTION" ;;
esac
EOS

# Arguments are shell-quoted because ssh joins them into one remote command line.
run_remote() { remote "bash -s -- $(printf '%q ' "$DEPLOY_PATH" "$APP_ROOT" "$@")" <<<"$REMOTE_LIB"; }

# Streams the tarball into the (already guarded, freshly created) release folder.
extract_remote() { remote "tar -xzf - -C $(printf '%q' "$DEPLOY_PATH/releases/$1")"; }

warn() {
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::warning::$*"; else printf '\033[1;33m!!\033[0m %s\n' "$*"; fi
}

# 0 = site answers OK; 1 = site answers with an HTTP error (the release is suspect -> roll back);
# 2 = site not reachable at all (DNS, firewall, nginx/SSL not set up yet). Rolling back can't fix
#     that, since the previous release is just as unreachable, so the new release stays live.
healthcheck() {
  [ -n "$HEALTHCHECK_URL" ] || return 0
  local url=$HEALTHCHECK_URL code=0
  case "$url" in http://* | https://*) ;; *) url="https://$url" ;; esac
  log "Health check: $url"
  for _ in 1 2 3 4 5; do
    code=0
    curl -fsS -o /dev/null --max-time 10 "$url" || code=$?
    [ "$code" -eq 0 ] && return 0
    sleep 3
  done
  if [ "$code" -eq 22 ]; then return 1; fi
  case "$code" in
    6) warn "Health check skipped: $url does not resolve. Point the domain's DNS at the VPS." ;;
    7) warn "Health check skipped: nothing answers at $url. Check nginx and the firewall (ports 80/443)." ;;
    35 | 51 | 60) warn "Health check skipped: HTTPS is not set up for $url yet (run certbot), or use an http:// APP_URL." ;;
    *) warn "Health check skipped: $url is not reachable (curl exit $code)." ;;
  esac
  return 2
}

cmd_deploy() {
  if [ -f .env.production ] && grep -Eq '^VITE_USE_MOCK_API=(true|1)' .env.production; then
    die ".env.production has VITE_USE_MOCK_API=true: refusing to ship a build that serves fake data."
  fi

  if [ "$SKIP_BUILD" != "true" ]; then
    log "Installing dependencies"
    npm ci --no-audit --no-fund
    log "Type-checking and building (mode: production)"
    npm run build
  fi
  [ -f dist/index.html ] || die "dist/index.html not found. Did the build run?"

  local sha release
  sha=$(git rev-parse --short HEAD 2>/dev/null || echo manual)
  release="$(date -u +%Y%m%dT%H%M%S)-$sha"

  log "Preparing release $release on $REMOTE:$DEPLOY_PATH"
  run_remote prepare "$release"

  log "Uploading dist/"
  if ! { tar -czf - -C dist . | extract_remote "$release" && run_remote finalize "$release"; }; then
    run_remote discard "$release" || true
    die "Upload failed; the live site was not changed."
  fi

  log "Activating release"
  run_remote activate "$release" "$KEEP_RELEASES"

  local health=0
  healthcheck || health=$?
  if [ "$health" -eq 2 ]; then
    log "Deployed $release (not verified: the site isn't publicly reachable yet)"
    return 0
  fi
  if [ "$health" -ne 0 ]; then
    log "Health check failed (HTTP error); rolling back"
    if run_remote rollback previous; then
      run_remote discard "$release" || true
      die "Deploy of $release failed its health check and was rolled back."
    fi
    die "Deploy of $release failed its health check and there was no previous release to restore. Check the server and nginx."
  fi
  log "Deployed $release"
}

case "${1:-deploy}" in
  deploy) cmd_deploy ;;
  rollback) log "Rolling back on $REMOTE"; run_remote rollback "${2:-}" ;;
  releases) run_remote releases ;;
  *) die "Usage: $0 [deploy|rollback [release]|releases]" ;;
esac
