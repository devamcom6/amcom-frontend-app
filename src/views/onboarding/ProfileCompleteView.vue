<script setup lang="ts">
import AuthCard from '@/components/auth/AuthCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
</script>

<template>
  <AuthCard>
    <AppSuccessPanel title="Profile setup complete" class="complete">
      <p>Your identity has been verified and your profile is now active. You can start exploring properties, making investments, and managing your portfolio.</p>
      <template #actions>
        <AppButton size="lg" block to="/dashboard">Go to Dashboard</AppButton>
        <AppButton variant="ghost" block to="/">Explore Amcom</AppButton>
      </template>
    </AppSuccessPanel>
  </AuthCard>
</template>

<style scoped>
.complete {
  padding-top: 32px;
}
</style>
