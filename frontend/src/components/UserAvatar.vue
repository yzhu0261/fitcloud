<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: 'RepVelta Member' },
  size: { type: Number, default: 44 },
})

const palettes = [
  ['#d9f36f', '#84d2a8', '#173f34'],
  ['#bfe7ff', '#7bb8f0', '#15324d'],
  ['#ffd88a', '#f3a76f', '#5b321c'],
  ['#e3c8ff', '#aa86e8', '#3c2759'],
  ['#aeece7', '#57c9bd', '#164944'],
]

const initial = computed(() => String(props.label || 'R').trim().charAt(0).toUpperCase() || 'R')
const palette = computed(() => {
  const hash = [...String(props.label)].reduce((total, character) => total + character.charCodeAt(0), 0)
  return palettes[hash % palettes.length]
})

const avatarStyle = computed(() => ({
  '--avatar-size': `${props.size}px`,
  '--avatar-start': palette.value[0],
  '--avatar-end': palette.value[1],
  '--avatar-ink': palette.value[2],
}))
</script>

<template>
  <span class="user-avatar" :style="avatarStyle" aria-hidden="true">
    <span>{{ initial }}</span>
    <i>
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M3 10h3l1.7-4.4 3 9 2-5H17" />
      </svg>
    </i>
  </span>
</template>

<style scoped>
.user-avatar { position: relative; width: var(--avatar-size); height: var(--avatar-size); display: inline-grid; flex: 0 0 var(--avatar-size); place-items: center; border: 2px solid rgba(255, 255, 255, .92); border-radius: 50%; background: linear-gradient(145deg, var(--avatar-start), var(--avatar-end)); box-shadow: 0 5px 16px rgba(39, 73, 61, .17), 0 0 0 1px rgba(39, 73, 61, .08); color: var(--avatar-ink); font-size: calc(var(--avatar-size) * .39); font-weight: 900; }
.user-avatar > span { transform: translateY(-1px); }
.user-avatar i { position: absolute; right: -3px; bottom: -2px; width: calc(var(--avatar-size) * .39); height: calc(var(--avatar-size) * .39); display: grid; place-items: center; border: 2px solid #fff; border-radius: 50%; background: #173f34; box-shadow: 0 3px 8px rgba(23, 63, 52, .2); }
.user-avatar svg { width: 75%; height: 75%; stroke: #d9f36f; stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; }
</style>
