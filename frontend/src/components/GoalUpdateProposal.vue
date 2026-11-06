<script setup>
defineProps({
  action: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['apply', 'discard'])
</script>

<template>
  <section :class="['goal-proposal', { compact }]">
    <div class="proposal-heading">
      <span>Goal update</span>
      <strong v-if="status === 'applied'">Applied</strong>
      <strong v-else-if="status === 'discarded'">Not applied</strong>
      <strong v-else>Needs your approval</strong>
    </div>

    <div class="goal-values">
      <div><span>Weekly workouts</span><strong>{{ action.weeklyWorkoutGoal }}</strong></div>
      <div><span>Daily calories</span><strong>{{ action.dailyCalorieGoal }} kcal</strong></div>
    </div>

    <p v-if="action.reason">{{ action.reason }}</p>

    <div v-if="!status" class="proposal-actions">
      <button type="button" class="apply-button" @click="$emit('apply')">Apply goals</button>
      <button type="button" class="discard-button" @click="$emit('discard')">Not now</button>
    </div>
  </section>
</template>

<style scoped>
.goal-proposal { width: min(620px, 100%); padding: 15px; border: 1px solid #cddda6; border-radius: 14px; background: linear-gradient(135deg, #f5fadf, #edf5e9); color: #17352c; }
.proposal-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.proposal-heading > span { font-size: .78rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
.proposal-heading > strong { padding: 5px 8px; border-radius: 999px; background: #fff; color: #52615d; font-size: .72rem; }
.goal-values { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.goal-values > div { padding: 10px 11px; border-radius: 10px; background: rgba(255,255,255,.78); display: flex; flex-direction: column; gap: 4px; }
.goal-values span { color: #607069; font-size: .78rem; }
.goal-values strong { font-size: 1rem; }
.goal-proposal > p { margin: 10px 0 0; color: #52615d; font-size: .86rem; line-height: 1.45; }
.proposal-actions { margin-top: 12px; display: flex; gap: 8px; }
.proposal-actions button { padding: 9px 12px; border-radius: 9px; font: inherit; font-size: .84rem; font-weight: 800; cursor: pointer; }
.apply-button { border: 0; background: #173f34; color: #fff; }
.discard-button { border: 1px solid #cbd7cf; background: #fff; color: #52615d; }
.compact { padding: 12px; }
.compact .goal-values { grid-template-columns: 1fr; }
.compact .proposal-heading { align-items: flex-start; flex-direction: column; gap: 6px; }
@media (max-width: 520px) { .goal-values { grid-template-columns: 1fr; } }
</style>
