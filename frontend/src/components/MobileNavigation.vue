<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

const navigationItems = [
  { to: '/dashboard', label: 'Home', icon: 'dashboard' },
  { to: '/workout', label: 'Workout', icon: 'workout' },
  { to: '/nutrition', label: 'Food', icon: 'nutrition' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
  { to: '/plan', label: 'Plan', icon: 'plan' },
  { to: '/account', label: 'Account', icon: 'account' },
]
</script>

<template>
  <nav class="mobile-navigation" aria-label="Mobile navigation">
    <RouterLink
      v-for="item in navigationItems"
      :key="item.to"
      :to="item.to"
      class="mobile-navigation-item"
    >
      <span class="mobile-navigation-icon"><AppIcon :name="item.icon" :size="21" /></span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.mobile-navigation {
  position: fixed;
  right: 12px;
  bottom: 12px;
  left: 12px;
  z-index: 1100;
  display: none;
  grid-template-columns: repeat(6, minmax(58px, 1fr));
  min-height: 70px;
  overflow-x: auto;
  border: 1px solid #d9e4dc;
  border-radius: 20px;
  background: rgba(255, 254, 253, .96);
  box-shadow: 0 16px 44px rgba(28, 61, 51, .18);
  backdrop-filter: blur(16px);
}

.mobile-navigation-item {
  display: flex;
  min-width: 58px;
  padding: 9px 5px 8px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  border-radius: 16px;
  color: #607069;
  font-size: .68rem;
  font-weight: 750;
  text-decoration: none;
}

.mobile-navigation-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 9px;
  font-size: 1rem;
}

.mobile-navigation-item.router-link-exact-active {
  color: #173f34;
}

.mobile-navigation-item.router-link-exact-active .mobile-navigation-icon {
  background: #e2f58b;
  box-shadow: 0 4px 12px rgba(99, 132, 44, .18);
}

@media (max-width: 1000px) {
  .mobile-navigation {
    display: grid;
  }
}

@media (max-width: 430px) {
  .mobile-navigation {
    right: 8px;
    bottom: 8px;
    left: 8px;
    border-radius: 17px;
  }
}
</style>
