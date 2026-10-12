<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import { useForm } from '@/composables/useForm'
import { COMPANY } from '@/constants/site'
import { contentService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { email, minLength, phone, required } from '@/utils/validators'

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const form = useForm(
  {
    full_name: auth.displayName || '',
    email: auth.user?.email ?? '',
    phone: auth.user?.phone ?? '',
    subject: typeof route.query.subject === 'string' ? route.query.subject : '',
    message: '',
  },
  {
    rules: {
      full_name: [required('Enter your name.')],
      email: [required('Enter your email address.'), email()],
      phone: [phone()],
      subject: [required('Add a subject.')],
      message: [required('Write a message.'), minLength(10, 'Tell us a little more (10+ characters).')],
    },
  },
)

async function send() {
  try {
    const res = await form.submit(() => contentService.contact(form.values))
    if (res) {
      ui.success('Message sent', `Reference ${res.reference}. We will reply within one business day.`)
      form.reset({ full_name: form.values.full_name, email: form.values.email, phone: form.values.phone })
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <section class="contact section">
    <div class="container contact__inner">
      <div class="contact__intro">
        <h1 class="contact__title display">Contact us</h1>
        <p class="contact__lead">
          Questions about an estate, an investment or a listing? Our team responds within one business day.
        </p>
        <ul class="contact__channels" role="list">
          <li><AppIcon name="map-pin" /> <span>{{ COMPANY.address }}</span></li>
          <li><AppIcon name="phone" /> <a :href="`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`">{{ COMPANY.phone }}</a></li>
          <li><AppIcon name="mail" /> <a :href="`mailto:${COMPANY.email}`">{{ COMPANY.email }}</a></li>
        </ul>
      </div>

      <form class="contact__form card" novalidate @submit.prevent="send">
        <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
        <AppAlert v-if="form.succeeded" tone="success" title="Thanks for reaching out">
          Your message has been delivered to our team.
        </AppAlert>
        <AppInput v-model="form.values.full_name" label="Full name" autocomplete="name" :error="form.errors.full_name" required @blur="form.touch('full_name')" />
        <div class="contact__row">
          <AppInput v-model="form.values.email" label="Email address" type="email" autocomplete="email" :error="form.errors.email" required @blur="form.touch('email')" />
          <AppInput v-model="form.values.phone" label="Phone number" type="tel" autocomplete="tel" optional :error="form.errors.phone" @blur="form.touch('phone')" />
        </div>
        <AppInput v-model="form.values.subject" label="Subject" :error="form.errors.subject" required @blur="form.touch('subject')" />
        <AppTextarea v-model="form.values.message" label="Message" :rows="5" :maxlength="2000" :error="form.errors.message" required @blur="form.touch('message')" />
        <AppButton type="submit" :loading="form.submitting" size="lg" block>Send message</AppButton>
      </form>
    </div>
  </section>
</template>

<style scoped>
.contact {
  background: var(--color-page);
  flex: 1;
}

.contact__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 620px);
  gap: 64px;
  align-items: start;
}

.contact__title {
  font-size: clamp(2rem, 1.4rem + 2vw, 3rem);
}

.contact__lead {
  margin-top: 16px;
  max-width: 460px;
  font-size: var(--text-md);
  color: var(--color-body);
}

.contact__channels {
  display: grid;
  gap: 16px;
  margin-top: 32px;
  color: var(--color-body);
}

.contact__channels li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.contact__channels :deep(svg) {
  color: var(--color-primary);
}

.contact__channels a:hover {
  color: var(--color-primary);
}

.contact__form {
  display: grid;
  gap: 20px;
  padding: 32px;
}

.contact__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 899px) {
  .contact__inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .contact__form {
    padding: 20px 16px;
  }
  .contact__row {
    grid-template-columns: 1fr;
  }
}
</style>
