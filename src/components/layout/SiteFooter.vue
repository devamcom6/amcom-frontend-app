<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import AppLogo from '@/components/base/AppLogo.vue'
import { COMPANY, SOCIAL_LINKS } from '@/constants/site'

const columns = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/contact?subject=Careers' },
      { label: 'Press', to: '/contact?subject=Press' },
      { label: 'Blog', to: '/about#insights' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Buy Property', to: '/properties' },
      { label: 'Sell Property', to: '/list-property' },
      { label: 'Property Management', to: '/property-management' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', to: '/contact' },
      { label: 'FAQs', to: '/buyback#faqs' },
    ],
  },
]
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__brand">
          <AppLogo :size="52" />
          <p class="footer__about">{{ COMPANY.description }}</p>
        </div>
        <nav v-for="col in columns" :key="col.title" class="footer__col" :aria-label="col.title">
          <h2 class="footer__heading">{{ col.title }}</h2>
          <ul role="list">
            <li v-for="link in col.links" :key="link.label">
              <RouterLink :to="link.to" class="footer__link">{{ link.label }}</RouterLink>
            </li>
          </ul>
        </nav>
        <div class="footer__col">
          <h2 class="footer__heading">Contact</h2>
          <ul role="list" class="footer__contact">
            <li><AppIcon name="map-pin" :size="16" /><span>{{ COMPANY.address }}</span></li>
            <li>
              <AppIcon name="phone" :size="16" />
              <a :href="`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`" class="footer__link">{{ COMPANY.phone }}</a>
            </li>
            <li>
              <AppIcon name="mail" :size="16" />
              <a :href="`mailto:${COMPANY.email}`" class="footer__link">{{ COMPANY.email }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copy">© {{ year }} Amcom. All rights reserved.</p>
        <nav class="footer__legal" aria-label="Legal">
          <RouterLink to="/legal/privacy-policy">Privacy Policy</RouterLink>
          <RouterLink to="/legal/terms-of-service">Terms of Service</RouterLink>
          <RouterLink to="/legal/cookie-policy">Cookie Policy</RouterLink>
        </nav>
        <ul class="footer__social" role="list">
          <li v-for="s in SOCIAL_LINKS" :key="s.label">
            <a :href="s.href" target="_blank" rel="noopener noreferrer" class="footer__social-link" :aria-label="`Amcom on ${s.label}`">
              <AppIcon :name="s.icon" :size="18" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  padding-top: 80px;
}

.footer__top {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) repeat(4, minmax(0, 1fr));
  gap: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--color-border);
}

.footer__brand {
  max-width: 400px;
}

.footer__about {
  margin-top: 40px;
  font-size: var(--text-sm);
  line-height: 1.45;
  color: var(--color-body);
}

.footer__heading {
  margin-bottom: 18px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-ink);
}

.footer__col ul {
  display: grid;
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer__link,
.footer__contact span {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.footer__link:hover {
  color: var(--color-primary);
}

.footer__contact li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: var(--color-muted);
}

.footer__contact :deep(svg) {
  margin-top: 2px;
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 0 72px;
}

.footer__copy {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.footer__legal {
  display: flex;
  gap: 24px;
  font-size: var(--text-xs);
  color: var(--color-body);
}

.footer__legal a:hover {
  color: var(--color-primary);
}

.footer__social {
  display: flex;
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer__social-link {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f3ee;
  color: var(--color-primary);
  transition: background-color var(--duration-fast) var(--ease);
}

.footer__social-link:hover {
  background: var(--color-primary-soft);
}

@media (max-width: 1023px) {
  .footer__top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .footer__brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .footer {
    padding-top: 48px;
  }

  .footer__top {
    grid-template-columns: 1fr;
    gap: 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .footer__about {
    margin-top: 28px;
    margin-bottom: 40px;
  }

  .footer__heading {
    margin-bottom: 14px;
  }

  .footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding-bottom: 48px;
  }

  .footer__bottom .footer__social {
    order: 1;
  }

  .footer__legal {
    order: 2;
    gap: 16px;
  }

  .footer__copy {
    order: 3;
    font-size: var(--text-sm);
  }
}
</style>
