<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AiCoachWidget from './components/AiCoachWidget.vue'

const route = useRoute()
const showCoachWidget = computed(
  () => route.meta.requiresAuth && route.name !== 'coach',
)
</script>

<template>
  <RouterView />
  <AiCoachWidget v-if="showCoachWidget" />
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
</style>
