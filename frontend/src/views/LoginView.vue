<script setup>
import { computed, ref } from 'vue'
import { signIn } from 'aws-amplify/auth'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthShell from '../components/AuthShell.vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const loginError = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)

const router = useRouter()
const route = useRoute()
const registrationComplete = computed(() => route.query.verified === 'true')
const passwordResetComplete = computed(() => route.query.reset === 'true')
const loginDestination = computed(() => {
  const redirect = Array.isArray(route.query.redirect)
    ? route.query.redirect[0]
    : route.query.redirect

  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard'
})

const handleLogin = async () => {
  emailError.value = ''
  passwordError.value = ''
  loginError.value = ''

  const emailPattern = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

  if (!email.value) {
    emailError.value = 'Email is required.'
  } else if (!emailPattern.test(email.value)) {
    emailError.value = 'Please enter a valid email address.'
  }

  if (!password.value) {
    passwordError.value = 'Password is required.'
  }

  if (emailError.value || passwordError.value) return

  isSubmitting.value = true

  try {
    const result = await signIn({
      username: email.value.trim().toLowerCase(),
      password: password.value,
    })

    if (result.isSignedIn) {
      await router.push(loginDestination.value)
      return
    }

    loginError.value = 'Your account needs an additional sign-in step.'
  } catch (error) {
    if (error.name === 'UserNotConfirmedException') {
      loginError.value = 'Please verify your email before signing in.'
    } else if (error.name === 'TooManyRequestsException') {
      loginError.value = 'Too many attempts. Please wait a moment and try again.'
    } else if (
      error.name === 'NotAuthorizedException' ||
      error.name === 'UserNotFoundException'
    ) {
      loginError.value = 'Incorrect email or password.'
    } else {
      loginError.value = 'We could not sign you in. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell
    eyebrow="WELCOME BACK"
    title="Sign in to RepVelta"
    description="Continue tracking the work you put in, one day at a time."
  >
    <div v-if="registrationComplete" class="alert alert-success" role="status">
      Your email is verified. You can sign in now.
    </div>
    <div v-if="passwordResetComplete" class="alert alert-success" role="status">
      Your password has been updated. You can sign in now.
    </div>

    <form class="auth-form" novalidate @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="login-email">Email address</label>
        <input
          id="login-email"
          v-model.trim="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :aria-invalid="Boolean(emailError)"
          :aria-describedby="emailError ? 'login-email-error' : undefined"
        />
        <p v-if="emailError" id="login-email-error" class="field-error">
          {{ emailError }}
        </p>
      </div>

      <div class="form-group">
        <div class="password-heading">
          <label for="login-password">Password</label>
          <RouterLink :to="{ path: '/forgot-password', query: email ? { email } : {} }">
            Forgot password?
          </RouterLink>
        </div>
        <div class="input-wrap">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Enter your password"
            :aria-invalid="Boolean(passwordError)"
            :aria-describedby="passwordError ? 'login-password-error' : undefined"
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
        <p v-if="passwordError" id="login-password-error" class="field-error">
          {{ passwordError }}
        </p>
      </div>

      <div v-if="loginError" class="alert alert-error" role="alert">
        {{ loginError }}
      </div>

      <button class="submit-button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <p class="auth-switch">
      New to RepVelta?
      <RouterLink to="/register">Create an account</RouterLink>
    </p>
  </AuthShell>
</template>

<style scoped>
.password-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.password-heading a { color: #315e51; font-size: .98rem; font-weight: 750; text-decoration: none; }
.password-heading a:hover { text-decoration: underline; }
</style>
