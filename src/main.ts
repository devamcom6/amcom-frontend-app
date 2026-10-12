import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.errorHandler = (err, _instance, info) => {
  // Hook a monitoring service (Sentry, etc.) here. Never surface raw errors to users.
  console.error('[amcom] unhandled error', info, err)
}

app.mount('#app')
