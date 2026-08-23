<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home">
    <h1>FitCloud</h1>

    <p>Track your fitness. Understand your nutrition. See your progress.</p>

    <div class="actions">
      <RouterLink class="button" to="/login">Login</RouterLink>
      <RouterLink class="button" to="/register">Create Account</RouterLink>
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