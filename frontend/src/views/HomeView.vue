<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getCurrentUser, signOut } from 'aws-amplify/auth'

const router = useRouter()

const isLoggedIn = ref(false)

onMounted(async () => {
  try {
    await getCurrentUser()
    isLoggedIn.value = true
  } catch {
    isLoggedIn.value = false
  }
})

const handleLogout = async () => {
  await signOut()
  isLoggedIn.value = false
  router.push('/login')
}
</script>

<template>
  <main class="home">
    <h1>FitCloud</h1>

    <p>Track your fitness. Understand your nutrition. See your progress.</p>

    <div class="actions">
      <template v-if="!isLoggedIn">
        <RouterLink class="button" to="/login">
          Login
        </RouterLink>

        <RouterLink class="button" to="/register">
          Create Account
        </RouterLink>
      </template>

      <button
        v-else
        type="button"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>
  </main>
</template>

<style scoped>
.home {
  padding: 40px;
}

.actions {
  display: flex;
  gap: 12px;
}

.button {
  padding: 10px 16px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
}
</style>