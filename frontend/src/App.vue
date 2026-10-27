<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AiCoachWidget from './components/AiCoachWidget.vue'
import MobileNavigation from './components/MobileNavigation.vue'

const route = useRoute()
const showCoachWidget = computed(
  () => route.meta.requiresAuth && route.name !== 'coach',
)
const showMobileNavigation = computed(() => route.meta.requiresAuth)
</script>

<template>
  <div :class="{ 'authenticated-app': showMobileNavigation }">
    <RouterView />
  </div>
  <AiCoachWidget v-if="showCoachWidget" />
  <MobileNavigation v-if="showMobileNavigation" />
</template>

<style>
html,
body,
#app {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

button,
input,
textarea {
  font-family: inherit;
}

@media (max-width: 1000px) {
  .authenticated-app {
    padding-bottom: 92px;
    background: #f1f5f2;
  }
}
</style>
