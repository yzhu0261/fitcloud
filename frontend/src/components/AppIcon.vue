<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 22 },
})
</script>

<template>
  <svg
    :class="['app-icon', `icon-${name}`]"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'dashboard'">
      <rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" />
    </template>
    <template v-else-if="name === 'workout'">
      <path d="M5 8v8M8 6v12M16 6v12M19 8v8M8 12h8M3 10v4M21 10v4" />
    </template>
    <template v-else-if="name === 'nutrition'">
      <path d="M12 8c-4-3-8 .1-7.2 5.3C5.5 18 8 21 12 21s6.5-3 7.2-7.7C20 8.1 16 5 12 8Z" />
      <path d="M12 8c-.3-2.6 1-4.2 3.5-5M11.5 5C9.6 3.6 8 3.7 7 4.3" />
    </template>
    <template v-else-if="name === 'progress'">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /><path d="m4 9 6-4 6 7 5-5" />
    </template>
    <template v-else-if="name === 'coach'">
      <path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8L12 3Z" />
      <path d="m19 15 .7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15Z" />
    </template>
    <template v-else-if="name === 'plan'">
      <rect x="4" y="3" width="16" height="18" rx="3" /><path d="M9 3v3M15 3v3M8 11l2 2 5-5M8 17h8" />
    </template>
    <template v-else-if="name === 'account'">
      <circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4.1 3.2-6.2 7.5-6.2s6.8 2.1 7.5 6.2" />
    </template>
  </svg>
</template>

<style scoped>
.app-icon { display: block; flex: 0 0 auto; }
.icon-dashboard { color: #3b82f6; }
.icon-workout { color: #f0642b; }
.icon-nutrition { color: #08a89d; }
.icon-progress { color: #9b51e0; }
.icon-coach { color: #52a83f; }
.icon-plan { color: #d79613; }
.icon-account { color: #5f7185; }
</style>
