<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const isMoreOpen = ref(false)

const primaryItems = [
  { to: '/dashboard', label: 'Home', icon: 'dashboard' },
  { to: '/workout', label: 'Workout', icon: 'workout' },
  { to: '/nutrition', label: 'Food', icon: 'nutrition' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
]

const moreItems = [
  { to: '/body', label: 'Body Metrics', description: 'Track weight and body measurements', icon: 'body' },
  { to: '/coach', label: 'AI Coach', description: 'Ask questions and adjust your goals', icon: 'coach' },
  { to: '/plan', label: 'Plan', description: 'Review your weekly training plan', icon: 'plan' },
  { to: '/account', label: 'Account', description: 'Manage profile, goals, and security', icon: 'account' },
]

const isMoreRouteActive = computed(() => moreItems.some((item) => route.path === item.to))

const closeMore = () => {
  isMoreOpen.value = false
}

const handleEscape = (event) => {
  if (event.key === 'Escape') closeMore()
}

watch(() => route.fullPath, closeMore)
onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <nav class="mobile-navigation" aria-label="Mobile navigation">
    <RouterLink
      v-for="item in primaryItems"
      :key="item.to"
      :to="item.to"
      class="mobile-navigation-item"
    >
      <span class="mobile-navigation-icon"><AppIcon :name="item.icon" :size="21" /></span>
      <span>{{ item.label }}</span>
    </RouterLink>

    <button
      type="button"
      class="mobile-navigation-item more-button"
      :class="{ active: isMoreOpen || isMoreRouteActive }"
      :aria-expanded="isMoreOpen"
      aria-controls="mobile-more-menu"
      @click="isMoreOpen = !isMoreOpen"
    >
      <span class="mobile-navigation-icon more-icon" aria-hidden="true">•••</span>
      <span>More</span>
    </button>
  </nav>

  <Transition name="more-menu">
    <div v-if="isMoreOpen" class="more-menu-layer" @click.self="closeMore">
      <section id="mobile-more-menu" class="more-menu" aria-label="More navigation">
        <div class="more-menu-heading">
          <div>
            <span>MORE</span>
            <strong>Explore RepVelta</strong>
          </div>
          <button type="button" aria-label="Close more menu" @click="closeMore">×</button>
        </div>

        <RouterLink v-for="item in moreItems" :key="item.to" :to="item.to" class="more-menu-item">
          <span class="more-menu-icon"><AppIcon :name="item.icon" :size="22" /></span>
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
          <span aria-hidden="true">→</span>
        </RouterLink>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.mobile-navigation {
  position: fixed;
  right: 12px;
  bottom: 12px;
  left: 12px;
  z-index: 1100;
  display: none;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: 70px;
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

.more-button {
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
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

.mobile-navigation-item.router-link-exact-active .mobile-navigation-icon,
.more-button.active .mobile-navigation-icon {
  background: #e2f58b;
  box-shadow: 0 4px 12px rgba(99, 132, 44, .18);
}

.more-button.active {
  color: #173f34;
}

.more-icon {
  padding-bottom: 8px;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.more-menu-layer {
  position: fixed;
  inset: 0;
  z-index: 1090;
  display: none;
  align-items: flex-end;
  justify-content: center;
  padding: 16px 12px 94px;
  background: rgba(18, 40, 33, .24);
  backdrop-filter: blur(3px);
}

.more-menu {
  width: min(100%, 460px);
  padding: 18px;
  border: 1px solid #d9e4dc;
  border-radius: 22px;
  background: #fffefd;
  box-shadow: 0 24px 60px rgba(28, 61, 51, .24);
}

.more-menu-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 2px 2px 14px;
}

.more-menu-heading div {
  display: grid;
  gap: 3px;
}

.more-menu-heading div > span {
  color: #74817b;
  font-size: .72rem;
  font-weight: 850;
  letter-spacing: .12em;
}

.more-menu-heading strong {
  color: #17352c;
  font-size: 1.12rem;
}

.more-menu-heading button {
  width: 38px;
  height: 38px;
  border: 1px solid #dde5e0;
  border-radius: 50%;
  background: #f5f8f6;
  color: #52615d;
  font-size: 1.35rem;
  cursor: pointer;
}

.more-menu-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 13px 11px;
  border-top: 1px solid #edf1ee;
  border-radius: 13px;
  color: #17352c;
  text-decoration: none;
}

.more-menu-item:hover,
.more-menu-item.router-link-exact-active {
  background: #f0f6e5;
}

.more-menu-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: #e8f1eb;
}

.more-menu-item > span:nth-child(2) {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.more-menu-item strong {
  font-size: .98rem;
}

.more-menu-item small {
  overflow: hidden;
  color: #68766f;
  font-size: .78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-menu-item > span:last-child {
  color: #7b8983;
  font-weight: 800;
}

.more-menu-enter-active,
.more-menu-leave-active {
  transition: opacity .18s ease;
}

.more-menu-enter-active .more-menu,
.more-menu-leave-active .more-menu {
  transition: transform .18s ease;
}

.more-menu-enter-from,
.more-menu-leave-to {
  opacity: 0;
}

.more-menu-enter-from .more-menu,
.more-menu-leave-to .more-menu {
  transform: translateY(18px);
}

@media (max-width: 1000px) {
  .mobile-navigation {
    display: grid;
  }

  .more-menu-layer {
    display: flex;
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
