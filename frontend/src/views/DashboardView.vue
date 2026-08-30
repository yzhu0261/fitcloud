<script setup>
import { useRouter } from 'vue-router'
import { signOut } from 'aws-amplify/auth'

const router = useRouter()

const handleLogout = async () => {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <main class="dashboard">
    <h1>Dashboard</h1>
    <p>Welcome to your FitCloud dashboard.</p>

    <div class="dashboard-actions">
      <button type="button">
        Today's Workout
      </button>

      <button type="button">
        Nutrition
      </button>

      <button type="button">
        Progress
      </button>
    </div>

    <button type="button" @click="handleLogout">
      Logout
    </button>
  </main>
</template>

<style scoped>
.dashboard-actions {
  display: flex;
  gap: 12px;
  margin: 24px 0;
}
</style>