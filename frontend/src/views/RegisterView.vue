<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

const handleRegister = () => {
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

console.log('Register validation passed')
}
</script>

<template>
  <main class="register-page">
    <h1>Create Account</h1>
    <p>Create your FitCloud account.</p>

    <form @submit.prevent="handleRegister" novalidate>
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