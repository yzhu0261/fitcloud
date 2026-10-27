<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/workout', label: 'Workout', icon: 'workout' },
  { to: '/nutrition', label: 'Nutrition', icon: 'nutrition' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
  { to: '/coach', label: 'AI Coach', icon: 'coach' },
  { to: '/plan', label: 'My Plan', icon: 'plan' },
  { to: '/account', label: 'My Account', icon: 'account' },
]
</script>

<template>
  <nav class="app-navigation" aria-label="Main navigation">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="navigation-item">
      <span class="icon-shell"><AppIcon :name="item.icon" /></span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.app-navigation { display: flex; flex-direction: column; gap: 7px; }
.navigation-item { display: flex; align-items: center; gap: 11px; min-height: 51px; padding: 7px 12px; border-radius: 14px; color: #52615d; font-size: 1.04rem; font-weight: 620; text-decoration: none; transition: background .18s ease, color .18s ease, transform .18s ease; }
.navigation-item:hover { background: #f0f5f1; color: #173f34; transform: translateX(2px); }
.icon-shell { width: 34px; height: 34px; display: grid; flex: 0 0 auto; place-items: center; border: 1px solid #e2e9e4; border-radius: 11px; background: #fff; box-shadow: 0 3px 10px rgba(30, 64, 53, .05); }
.navigation-item.router-link-exact-active { background: #e8f4bd; color: #173f34; font-weight: 800; }
.navigation-item.router-link-exact-active .icon-shell { border-color: rgba(116, 153, 49, .22); background: rgba(255, 255, 255, .72); box-shadow: 0 5px 14px rgba(77, 111, 48, .12); }
</style>
