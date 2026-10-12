<script setup lang="ts">
import AuthCard from '@/components/auth/AuthCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
</script>

<template>
  <AuthCard>
    <AppSuccessPanel title="Account Created!" class="created">
      <p>Your AMCOM account has been successfully created.</p>
      <template #actions>
        <AppButton size="lg" block to="/onboarding">Setup your profile</AppButton>
        <AppButton variant="ghost" block to="/">Explore Amcom first</AppButton>
      </template>
    </AppSuccessPanel>
  </AuthCard>
</template>

<style scoped>
.created {
  padding-top: 32px;
}
</style>
