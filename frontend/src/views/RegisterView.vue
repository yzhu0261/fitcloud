<script setup>
import { ref } from 'vue'
import { signUp, confirmSignUp } from 'aws-amplify/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const confirmationCode = ref('')
const needsConfirmation = ref(false)

const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const router = useRouter()

const handleRegister = async () => {
  emailError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''

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

  try {
    const result = await signUp({
      username: email.value,
      password: password.value,
      options: {
        userAttributes: {
          email: email.value,
        },
      },
    })

    console.log('Sign up result:', result)

    if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      needsConfirmation.value = true
    }
  } catch (error) {
    console.error('Sign up error:', error)
  }
}

const handleConfirm = async () => {
  try {
    const result = await confirmSignUp({
      username: email.value,
      confirmationCode: confirmationCode.value,
    })

    console.log('Confirmation result:', result)

    if (result.isSignUpComplete) {
      console.log('Registration completed!')
      router.push('/login')
    }
  } catch (error) {
    console.error('Confirmation error:', error)
  }
}
</script>

<template>
  <main class="register-page">
    <h1>Create Account</h1>
    <p v-if="!needsConfirmation">
      Create your FitCloud account.
    </p>

    <form
      v-if="!needsConfirmation"
      @submit.prevent="handleRegister"
      novalidate
    >
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" v-model="email" />

        <p v-if="emailError" class="error">
          {{ emailError }}
        </p>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input id="password" type="password" v-model="password" />

        <p v-if="passwordError" class="error">
          {{ passwordError }}
        </p>
      </div>

      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input
          id="confirm-password"
          type="password"
          v-model="confirmPassword"
        />

        <p v-if="confirmPasswordError" class="error">
          {{ confirmPasswordError }}
        </p>
      </div>

      <button type="submit">Register</button>
    </form>

    <div v-else class="confirmation">
      <h2>Verify your email</h2>

      <p>
        We sent a verification code to {{ email }}.
      </p>

      <div class="form-group">
        <label for="confirmation-code">Verification Code</label>

        <input
          id="confirmation-code"
          type="text"
          v-model="confirmationCode"
        />
      </div>

      <button type="button" @click="handleConfirm">
        Confirm
      </button>
    </div>
  </main>
</template>

<style scoped>
.register-page {
  max-width: 400px;
  margin: 60px auto;
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-group input {
  margin-top: 6px;
  padding: 10px;
}

button {
  padding: 10px 16px;
}

.error {
  color: red;
  margin-top: 6px;
}
</style>