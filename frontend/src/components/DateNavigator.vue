<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  max: { type: String, required: true },
  label: { type: String, default: 'Log date' },
})

const emit = defineEmits(['update:modelValue'])
const isLatestDate = computed(() => props.modelValue >= props.max)

const toLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const changeDate = (days) => {
  const date = new Date(`${props.modelValue}T12:00:00`)
  if (Number.isNaN(date.getTime())) return

  date.setDate(date.getDate() + days)
  const nextDate = toLocalDate(date)
  if (nextDate <= props.max) emit('update:modelValue', nextDate)
}

const updateFromInput = (event) => {
  const value = event.target.value
  if (value && value <= props.max) emit('update:modelValue', value)
}
</script>

<template>
  <div class="date-navigator" aria-label="Choose record date">
    <button type="button" class="date-step" aria-label="Previous day" title="Previous day" @click="changeDate(-1)">‹</button>

    <label class="date-field">
      <span>{{ label }}</span>
      <input type="date" :value="modelValue" :max="max" @input="updateFromInput" />
    </label>

    <button type="button" class="date-step" aria-label="Next day" title="Next day" :disabled="isLatestDate" @click="changeDate(1)">›</button>

    <button type="button" class="today-button" :disabled="isLatestDate" @click="emit('update:modelValue', max)">Today</button>
  </div>
</template>

<style scoped>
.date-navigator { display: flex; align-items: stretch; gap: 7px; }
.date-field { min-width: 170px; padding: 7px 11px; display: grid; gap: 2px; border: 1px solid #d9e1dc; border-radius: 12px; background: #fffefd; }
.date-field span { color: #68766f; font-size: .7rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.date-field input { min-width: 0; border: 0; outline: 0; background: transparent; color: #17352c; font: inherit; font-size: .88rem; font-weight: 750; }
.date-step, .today-button { min-height: 49px; border: 1px solid #d5dfd9; border-radius: 11px; background: #fffefd; color: #315e51; font: inherit; font-weight: 850; cursor: pointer; }
.date-step { width: 42px; padding: 0; font-size: 1.5rem; }
.today-button { padding: 0 13px; font-size: .82rem; }
.date-step:hover:not(:disabled), .today-button:hover:not(:disabled) { border-color: #afc45f; background: #f0f8d3; }
.date-step:focus-visible, .today-button:focus-visible, .date-field:focus-within { outline: 3px solid rgba(203, 237, 99, .4); outline-offset: 1px; }
.date-step:disabled, .today-button:disabled { cursor: default; opacity: .42; }
@media (max-width: 680px) {
  .date-navigator { width: 100%; display: grid; grid-template-columns: 42px minmax(0, 1fr) 42px; }
  .date-field { min-width: 0; }
  .today-button { min-height: 38px; grid-column: 1 / -1; }
}
</style>
