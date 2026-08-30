<script setup>
import { ref } from 'vue'
import { signIn } from 'aws-amplify/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')

const emailError = ref('')
const passwordError = ref('')

const router = useRouter()

const handleLogin = async () => {
  emailError.value = ''
  passwordError.value = ''

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

  if (emailError.value || passwordError.value) {
  return
}

  try {
    const result = await signIn({
      username: email.value,
      password: password.value,
    })

    console.log('Sign in result:', result)

    if (result.isSignedIn) {
      console.log('Login successful!')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Sign in error:', error)
  }
}

const handleLogout = async () => {
  await signOut()
  console.log('Logged out')
}
</script>

<template>
  <main class="login-page">
    <h1>Login</h1>
    <p>Sign in to your FitCloud account.</p>

    <form @submit.prevent="handleLogin" novalidate>
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

      <div class="actions">
        <button type="submit">Login</button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
}

.login-page {
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