<script setup>
import { ref } from 'vue'
import { confirmSignUp, resendSignUpCode, signUp } from 'aws-amplify/auth'
import { RouterLink, useRouter } from 'vue-router'
import AuthShell from '../components/AuthShell.vue'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const confirmationCode = ref('')
const needsConfirmation = ref(false)
const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const confirmationError = ref('')
const registerError = ref('')
const resendMessage = ref('')
const isSubmitting = ref(false)
const isResending = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const router = useRouter()

const getRegistrationError = (error) => {
  const errorMessages = {
    UsernameExistsException: 'An account with this email already exists.',
    InvalidPasswordException:
      'Password must include uppercase, lowercase, number and symbol characters.',
    LimitExceededException:
      'Too many registration attempts. Please wait a moment and try again.',
    TooManyRequestsException:
      'Too many requests. Please wait a moment and try again.',
    CodeDeliveryFailureException:
      'Your account was created, but the verification email could not be sent.',
    NotAuthorizedException:
      'The registration service is not configured correctly. Please contact support.',
    UnknownError:
      'The Cognito app client could not be found. Check the User Pool and App Client configuration.',
    ResourceNotFoundException:
      'The Cognito app client could not be found. Check the User Pool and App Client configuration.',
  }

  if (errorMessages[error?.name]) return errorMessages[error.name]

  if (error?.name === 'InvalidParameterException') {
    return error.message || 'Some registration details are invalid.'
  }

  if (error instanceof TypeError) {
    return 'Unable to connect to the registration service. Check your connection.'
  }

  if (error?.message && error.message.toLowerCase() !== 'unknown error') {
    return error.message
  }

  return 'The registration service returned an unknown error. Check the Cognito configuration.'
}

const handleRegister = async () => {
  emailError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  registerError.value = ''

  const emailPattern = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

  if (!email.value) {
    emailError.value = 'Email is required.'
  } else if (!emailPattern.test(email.value)) {
    emailError.value = 'Please enter a valid email address.'
  }

  if (!password.value) {
    passwordError.value = 'Password is required.'
  } else if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
  } else if (!/[a-z]/.test(password.value)) {
    passwordError.value = 'Password must include a lowercase letter.'
  } else if (!/[A-Z]/.test(password.value)) {
    passwordError.value = 'Password must include an uppercase letter.'
  } else if (!/[0-9]/.test(password.value)) {
    passwordError.value = 'Password must include a number.'
  } else if (!/[^A-Za-z0-9]/.test(password.value)) {
    passwordError.value = 'Password must include a symbol.'
  }

  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password.'
  } else if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match.'
  }

  if (
    emailError.value ||
    passwordError.value ||
    confirmPasswordError.value
  ) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await signUp({
      username: email.value.trim().toLowerCase(),
      password: password.value,
      options: {
        userAttributes: {
          email: email.value.trim().toLowerCase(),
        },
      },
    })

    if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      needsConfirmation.value = true
    } else if (result.isSignUpComplete) {
      await router.push({ path: '/login', query: { verified: 'true' } })
    }
  } catch (error) {
    registerError.value = getRegistrationError(error)
    console.error('Registration failed:', error.name, error.message)
  } finally {
    isSubmitting.value = false
  }
}

const handleConfirm = async () => {
  confirmationError.value = ''
  resendMessage.value = ''

  if (!confirmationCode.value.trim()) {
    confirmationError.value = 'Verification code is required.'
    return
  }

  isSubmitting.value = true

  try {
    const result = await confirmSignUp({
      username: email.value.trim().toLowerCase(),
      confirmationCode: confirmationCode.value.trim(),
    })

    if (result.isSignUpComplete) {
      await router.push({ path: '/login', query: { verified: 'true' } })
    }
  } catch (error) {
    if (error.name === 'CodeMismatchException') {
      confirmationError.value = 'That verification code is incorrect.'
    } else if (error.name === 'ExpiredCodeException') {
      confirmationError.value = 'That code has expired. Request a new one below.'
    } else {
      confirmationError.value = 'We could not verify your email. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleResend = async () => {
  confirmationError.value = ''
  resendMessage.value = ''
  isResending.value = true

  try {
    await resendSignUpCode({ username: email.value.trim().toLowerCase() })
    resendMessage.value = 'A new verification code has been sent.'
  } catch {
    confirmationError.value = 'We could not resend the code. Please try again.'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <AuthShell
    :eyebrow="needsConfirmation ? 'ONE LAST STEP' : 'START YOUR JOURNEY'"
    :title="needsConfirmation ? 'Verify your email' : 'Create your account'"
    :description="
      needsConfirmation
        ? `We sent a verification code to ${email}.`
        : 'Set up your account and start building a healthier routine.'
    "
  >
    <form
      v-if="!needsConfirmation"
      class="auth-form"
      novalidate
      @submit.prevent="handleRegister"
    >
      <div class="form-group">
        <label for="register-email">Email address</label>
        <input
          id="register-email"
          v-model.trim="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :aria-invalid="Boolean(emailError)"
          :aria-describedby="emailError ? 'register-email-error' : undefined"
        />
        <p v-if="emailError" id="register-email-error" class="field-error">
          {{ emailError }}
        </p>
      </div>

      <div class="form-group">
        <label for="register-password">Password</label>
        <div class="input-wrap">
          <input
            id="register-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Create a password"
            :aria-invalid="Boolean(passwordError)"
            :aria-describedby="passwordError ? 'register-password-error' : 'password-hint'"
          />
          <button
            type="button"
            class="password-toggle"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p v-if="passwordError" id="register-password-error" class="field-error">
          {{ passwordError }}
        </p>
        <p v-else id="password-hint" class="field-hint">
          8+ characters with uppercase, lowercase, number and symbol.
        </p>
      </div>

      <div class="form-group">
        <label for="confirm-password">Confirm password</label>
        <div class="input-wrap">
          <input
            id="confirm-password"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Enter your password again"
            :aria-invalid="Boolean(confirmPasswordError)"
            :aria-describedby="confirmPasswordError ? 'confirm-password-error' : undefined"
          />
          <button
            type="button"
            class="password-toggle"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            {{ showConfirmPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p v-if="confirmPasswordError" id="confirm-password-error" class="field-error">
          {{ confirmPasswordError }}
        </p>
      </div>

      <div v-if="registerError" class="alert alert-error" role="alert">
        {{ registerError }}
      </div>

      <button class="submit-button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Creating account...' : 'Create account' }}
      </button>
    </form>

    <form v-else class="auth-form" novalidate @submit.prevent="handleConfirm">
      <div class="form-group">
        <label for="confirmation-code">Verification code</label>
        <input
          id="confirmation-code"
          v-model="confirmationCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="Enter your code"
          :aria-invalid="Boolean(confirmationError)"
          :aria-describedby="confirmationError ? 'confirmation-error' : undefined"
        />
      </div>

      <div v-if="confirmationError" id="confirmation-error" class="alert alert-error" role="alert">
        {{ confirmationError }}
      </div>
      <div v-if="resendMessage" class="alert alert-success" role="status">
        {{ resendMessage }}
      </div>

      <button class="submit-button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Verifying...' : 'Verify email' }}
      </button>

      <p class="auth-switch">
        Didn't receive a code?
        <button type="button" class="text-button" :disabled="isResending" @click="handleResend">
          {{ isResending ? 'Sending...' : 'Send another' }}
        </button>
      </p>
    </form>

    <p v-if="!needsConfirmation" class="auth-switch">
      Already have an account?
      <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </AuthShell>
</template>
