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
    <h1>RepVelta</h1>

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
  min-height: 100vh;
  display: grid;
  place-content: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #edf5df 0%, #eef4f1 52%, #e8f1f5 100%);
  color: #17352c;
  font-family: Inter, Arial, Helvetica, sans-serif;
  text-align: center;
}

.home h1 {
  margin: 0;
  font-size: clamp(3.2rem, 7vw, 5.5rem);
  letter-spacing: -0.05em;
}

.home > p {
  max-width: 720px;
  margin: 22px auto 34px;
  color: #52615d;
  font-size: clamp(1.15rem, 2vw, 1.4rem);
  line-height: 1.6;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.button,
.actions button {
  min-width: 150px;
  padding: 14px 22px;
  border: 0;
  background: #cbed63;
  color: #17352c;
  font-size: 1.05rem;
  font-weight: 800;
  text-decoration: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(121, 168, 50, 0.18);
}
</style>
