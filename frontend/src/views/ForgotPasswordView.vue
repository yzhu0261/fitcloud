<script setup>
import { ref } from 'vue'
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthShell from '../components/AuthShell.vue'

const route = useRoute()
const router = useRouter()

const email = ref(String(route.query.email || ''))
const confirmationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const needsCode = ref(false)
const emailError = ref('')
const codeError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const pageError = ref('')
const deliveryMessage = ref('')
const isSubmitting = ref(false)
const isResending = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const normalizedEmail = () => email.value.trim().toLowerCase()

const validateEmail = () => {
  emailError.value = ''
  const emailPattern = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

  if (!normalizedEmail()) {
    emailError.value = 'Email is required.'
  } else if (!emailPattern.test(normalizedEmail())) {
    emailError.value = 'Please enter a valid email address.'
  }

  return !emailError.value
}

const validateNewPassword = () => {
  passwordError.value = ''
  confirmPasswordError.value = ''

  if (!newPassword.value) {
    passwordError.value = 'Password is required.'
  } else if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
  } else if (!/[a-z]/.test(newPassword.value)) {
    passwordError.value = 'Password must include a lowercase letter.'
  } else if (!/[A-Z]/.test(newPassword.value)) {
    passwordError.value = 'Password must include an uppercase letter.'
  } else if (!/[0-9]/.test(newPassword.value)) {
    passwordError.value = 'Password must include a number.'
  } else if (!/[^A-Za-z0-9]/.test(newPassword.value)) {
    passwordError.value = 'Password must include a symbol.'
  }

  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your new password.'
  } else if (confirmPassword.value !== newPassword.value) {
    confirmPasswordError.value = 'Passwords do not match.'
  }

  return !passwordError.value && !confirmPasswordError.value
}

const requestResetCode = async (isResend = false) => {
  pageError.value = ''
  deliveryMessage.value = ''

  if (!validateEmail()) return

  if (isResend) {
    isResending.value = true
  } else {
    isSubmitting.value = true
  }

  try {
    const result = await resetPassword({ username: normalizedEmail() })

    if (
      result.nextStep.resetPasswordStep ===
      'CONFIRM_RESET_PASSWORD_WITH_CODE'
    ) {
      needsCode.value = true
      const destination = result.nextStep.codeDeliveryDetails?.destination
      deliveryMessage.value = isResend
        ? 'A new verification code has been sent.'
        : `We sent a verification code${destination ? ` to ${destination}` : ' to your email'}.`
    }
  } catch (error) {
    if (error.name === 'LimitExceededException' || error.name === 'TooManyRequestsException') {
      pageError.value = 'Too many attempts. Please wait a moment and try again.'
    } else if (error.name === 'UserNotFoundException') {
      needsCode.value = true
      deliveryMessage.value =
        'If an account exists for this email, a verification code has been sent.'
    } else {
      pageError.value = 'We could not send a reset code. Please try again.'
    }
  } finally {
    isSubmitting.value = false
    isResending.value = false
  }
}

const handleResetPassword = async () => {
  codeError.value = ''
  pageError.value = ''

  if (!confirmationCode.value.trim()) {
    codeError.value = 'Verification code is required.'
  }

  if (!validateNewPassword() || codeError.value) return

  isSubmitting.value = true

  try {
    await confirmResetPassword({
      username: normalizedEmail(),
      confirmationCode: confirmationCode.value.trim(),
      newPassword: newPassword.value,
    })

    await router.push({ path: '/login', query: { reset: 'true' } })
  } catch (error) {
    if (error.name === 'CodeMismatchException') {
      codeError.value = 'That verification code is incorrect.'
    } else if (error.name === 'ExpiredCodeException') {
      codeError.value = 'That code has expired. Request a new one below.'
    } else if (error.name === 'InvalidPasswordException') {
      passwordError.value =
        'Password must include uppercase, lowercase, number and symbol characters.'
    } else {
      pageError.value = 'We could not reset your password. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell
    :eyebrow="needsCode ? 'CHECK YOUR EMAIL' : 'ACCOUNT RECOVERY'"
    :title="needsCode ? 'Create a new password' : 'Reset your password'"
    :description="
      needsCode
        ? 'Enter the verification code and choose a secure new password.'
        : 'Enter your account email and we will send you a verification code.'
    "
  >
    <form v-if="!needsCode" class="auth-form" novalidate @submit.prevent="requestResetCode()">
      <div class="form-group">
        <label for="reset-email">Email address</label>
        <input
          id="reset-email"
          v-model.trim="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :aria-invalid="Boolean(emailError)"
          :aria-describedby="emailError ? 'reset-email-error' : undefined"
        />
        <p v-if="emailError" id="reset-email-error" class="field-error">{{ emailError }}</p>
      </div>

      <div v-if="pageError" class="alert alert-error" role="alert">{{ pageError }}</div>

      <button class="submit-button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Sending code...' : 'Send verification code' }}
      </button>
    </form>

    <form v-else class="auth-form" novalidate @submit.prevent="handleResetPassword">
      <div v-if="deliveryMessage" class="alert alert-success" role="status">
        {{ deliveryMessage }}
      </div>

      <div class="form-group">
        <label for="reset-code">Verification code</label>
        <input
          id="reset-code"
          v-model.trim="confirmationCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="Enter your code"
          :aria-invalid="Boolean(codeError)"
          :aria-describedby="codeError ? 'reset-code-error' : undefined"
        />
        <p v-if="codeError" id="reset-code-error" class="field-error">{{ codeError }}</p>
      </div>

      <div class="form-group">
        <label for="reset-password">New password</label>
        <div class="input-wrap">
          <input
            id="reset-password"
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Create a new password"
            :aria-invalid="Boolean(passwordError)"
            :aria-describedby="passwordError ? 'reset-password-error' : 'reset-password-hint'"
          />
          <button type="button" class="password-toggle" @click="showPassword = !showPassword">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p v-if="passwordError" id="reset-password-error" class="field-error">{{ passwordError }}</p>
        <p v-else id="reset-password-hint" class="field-hint">
          8+ characters with uppercase, lowercase, number and symbol.
        </p>
      </div>

      <div class="form-group">
        <label for="reset-confirm-password">Confirm new password</label>
        <div class="input-wrap">
          <input
            id="reset-confirm-password"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Enter your password again"
            :aria-invalid="Boolean(confirmPasswordError)"
            :aria-describedby="confirmPasswordError ? 'reset-confirm-password-error' : undefined"
          />
          <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p v-if="confirmPasswordError" id="reset-confirm-password-error" class="field-error">
          {{ confirmPasswordError }}
        </p>
      </div>

      <div v-if="pageError" class="alert alert-error" role="alert">{{ pageError }}</div>

      <button class="submit-button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Updating password...' : 'Update password' }}
      </button>

      <p class="auth-switch">
        Didn't receive a code?
        <button type="button" class="text-button" :disabled="isResending" @click="requestResetCode(true)">
          {{ isResending ? 'Sending...' : 'Send another' }}
        </button>
      </p>
    </form>

    <p class="auth-switch">
      Remember your password?
      <RouterLink to="/login">Back to sign in</RouterLink>
    </p>
  </AuthShell>
</template>

