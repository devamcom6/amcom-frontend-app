import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { config } from '@/config/env'
import { paymentService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { PayableType, PaymentMethod } from '@/types'
import { writeString } from '@/utils/storage'

export const PAYMENT_RETURN_KEY = 'amcom.payment.return'

/**
 * Starts a Paystack payment through Laravel and redirects to Paystack's hosted checkout.
 *
 * 1. Laravel creates the transaction with the SECRET key and returns `authorization_url`.
 * 2. The browser is sent to Paystack. Card/bank details never touch our frontend.
 * 3. Paystack redirects back to `/payments/callback?reference=…`, where the frontend asks
 *    Laravel for the *verified* status. The redirect alone is never treated as success.
 */
export function usePayment() {
  const ui = useUiStore()
  const router = useRouter()
  const processing = ref(false)

  async function pay(payableType: PayableType, payableId: number, method: PaymentMethod) {
    processing.value = true
    try {
      const callback = new URL(router.resolve({ name: 'payment-callback' }).href, config.appUrl).toString()
      const init = await paymentService.initialize({
        payable_type: payableType,
        payable_id: payableId,
        method,
        callback_url: callback,
      })
      const target = new URL(init.authorization_url)
      const allowed = ['checkout.paystack.com', window.location.host]
      if (!allowed.includes(target.host)) {
        throw new Error('Unexpected payment redirect host')
      }
      // Remember where to send the user back to if the payment fails or is abandoned.
      writeString(PAYMENT_RETURN_KEY, router.currentRoute.value.fullPath, 'session')
      window.location.assign(init.authorization_url)
    } catch (e) {
      ui.apiError(e, "We couldn't start the payment. Please try again.")
      processing.value = false
    }
  }

  return { pay, processing }
}
