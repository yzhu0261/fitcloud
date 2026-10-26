<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { signOut } from 'aws-amplify/auth'
import {
  deleteWeeklyPlan,
  loadWeeklyPlan,
  updateWeeklyPlanDay,
  weeklyPlanUpdatedEvent,
} from '../services/weeklyPlan'

const router = useRouter()
const plan = ref(null)
const isLoading = ref(true)
const updatingDay = ref(null)
const isDeleting = ref(false)
const confirmDelete = ref(false)
const pageError = ref('')
const notice = ref('')

const todayKey = new Date().toLocaleDateString('en-CA')
const completedCount = computed(
  () => plan.value?.days?.filter((day) => day.completed).length || 0,
)
const completionPercentage = computed(() =>
  plan.value ? Math.round((completedCount.value / plan.value.days.length) * 100) : 0,
)

const formatDate = (value) => {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day))
}

const refreshPlan = async (event) => {
  pageError.value = ''

  try {
    plan.value = event?.detail ?? (await loadWeeklyPlan())
  } catch (error) {
    pageError.value = error.message || 'Your weekly plan could not be loaded.'
  } finally {
    isLoading.value = false
  }
}

const toggleDay = async (day) => {
  if (!plan.value || updatingDay.value) return

  pageError.value = ''
  notice.value = ''
  updatingDay.value = day.dayNumber

  try {
    plan.value = await updateWeeklyPlanDay(
      plan.value,
      day.dayNumber,
      !day.completed,
    )
    notice.value = day.completed
      ? `Day ${day.dayNumber} marked as incomplete.`
      : `Day ${day.dayNumber} completed. Nice work.`
  } catch (error) {
    pageError.value = error.message || 'This day could not be updated.'
  } finally {
    updatingDay.value = null
  }
}

const removePlan = async () => {
  if (!plan.value || isDeleting.value) return

  pageError.value = ''
  isDeleting.value = true

  try {
    await deleteWeeklyPlan(plan.value)
    plan.value = null
    confirmDelete.value = false
    notice.value = 'Your weekly plan has been deleted.'
  } catch (error) {
    pageError.value = error.message || 'The weekly plan could not be deleted.'
  } finally {
    isDeleting.value = false
  }
}

const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

onMounted(() => {
  refreshPlan()
  window.addEventListener(weeklyPlanUpdatedEvent, refreshPlan)
})

onUnmounted(() => {
  window.removeEventListener(weeklyPlanUpdatedEvent, refreshPlan)
})
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand"><div class="brand-mark">R</div><span>RepVelta</span></div>
        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item"><span>▦</span> Dashboard</RouterLink>
          <RouterLink to="/workout" class="nav-item"><span>◫</span> Workout</RouterLink>
          <RouterLink to="/nutrition" class="nav-item"><span>◉</span> Nutrition</RouterLink>
          <RouterLink to="/progress" class="nav-item"><span>⌁</span> Progress</RouterLink>
          <RouterLink to="/coach" class="nav-item"><span>✦</span> AI Coach</RouterLink>
          <RouterLink to="/plan" class="nav-item"><span>✓</span> My Plan</RouterLink>
          <RouterLink to="/account" class="nav-item"><span>●</span> My Account</RouterLink>
        </nav>
      </div>

      <div>
        <div class="sidebar-card">
          <div class="sidebar-card-icon">✓</div>
          <h3>Plan.<br />Complete.<br />Repeat.</h3>
          <p>Small sessions add up. Keep moving through your week one day at a time.</p>
        </div>
        <button type="button" class="logout-button" @click="handleLogout">Logout</button>
      </div>
    </aside>

    <section class="main-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">YOUR AI TRAINING WEEK</p>
          <h1>My Plan</h1>
          <p>Follow your seven-day plan and keep track of each completed day.</p>
        </div>
        <RouterLink to="/account" class="profile">
          <span class="profile-avatar">A</span>
          <span><strong>My Account</strong><small>RepVelta Member</small></span>
        </RouterLink>
      </header>

      <p v-if="pageError" class="feedback error" role="alert">{{ pageError }}</p>
      <p v-if="notice" class="feedback success" aria-live="polite">{{ notice }}</p>

      <section v-if="isLoading" class="empty-card">
        <div class="empty-icon">✦</div>
        <h2>Loading your plan…</h2>
      </section>

      <template v-else-if="plan">
        <section class="plan-summary">
          <div>
            <p class="eyebrow">CURRENT PLAN</p>
            <h2>{{ formatDate(plan.startDate) }} – {{ formatDate(plan.endDate) }}</h2>
            <p>{{ completedCount }} of 7 days completed</p>
          </div>
          <div class="progress-score" :aria-label="`${completionPercentage}% complete`">
            <strong>{{ completionPercentage }}%</strong>
            <span>complete</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <span :style="{ width: `${completionPercentage}%` }"></span>
          </div>
        </section>

        <section class="plan-grid" aria-label="Seven-day training plan">
          <article
            v-for="day in plan.days"
            :key="day.dayNumber"
            :class="['day-card', { completed: day.completed, today: day.date === todayKey }]"
          >
            <div class="day-heading">
              <div class="day-number">{{ day.completed ? '✓' : String(day.dayNumber).padStart(2, '0') }}</div>
              <div>
                <p>DAY {{ day.dayNumber }}<span v-if="day.date === todayKey">TODAY</span></p>
                <h2>{{ formatDate(day.date) }}</h2>
              </div>
            </div>
            <p class="day-details">{{ day.details }}</p>
            <div class="day-actions">
              <RouterLink :to="`/workout?fromPlan=1&day=${day.dayNumber}`">Start workout</RouterLink>
              <button type="button" :disabled="updatingDay === day.dayNumber" @click="toggleDay(day)">
                {{ updatingDay === day.dayNumber ? 'Saving…' : day.completed ? 'Mark incomplete' : 'Mark complete' }}
              </button>
            </div>
          </article>
        </section>

        <section class="plan-footer">
          <div>
            <h2>Need a different plan?</h2>
            <p>Ask your AI Coach to create a new week based on your latest activity and goals.</p>
          </div>
          <div class="footer-actions">
            <RouterLink to="/coach" class="regenerate-link">Ask AI Coach</RouterLink>
            <button v-if="!confirmDelete" type="button" class="delete-button" @click="confirmDelete = true">Delete plan</button>
          </div>
          <div v-if="confirmDelete" class="delete-confirmation" role="alert">
            <p><strong>Delete this plan?</strong><span>This permanently removes it from your account.</span></p>
            <button type="button" @click="confirmDelete = false">Keep plan</button>
            <button type="button" class="confirm-delete" :disabled="isDeleting" @click="removePlan">
              {{ isDeleting ? 'Deleting…' : 'Yes, delete' }}
            </button>
          </div>
        </section>
      </template>

      <section v-else class="empty-card">
        <div class="empty-icon">✦</div>
        <p class="eyebrow">NO ACTIVE PLAN</p>
        <h2>Create your first seven-day plan</h2>
        <p>Your AI Coach can use your goals and saved activity to build a personalised training week.</p>
        <RouterLink to="/coach">Create with AI Coach</RouterLink>
      </section>
    </section>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 270px 1fr; background: #f1f5f2; color: #172033; font-family: Inter, Arial, Helvetica, sans-serif; }
.sidebar { min-height: 100vh; padding: 36px 28px; border-right: 1px solid #dfe8e2; background: #fffefd; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 46px; font-size: 1.5rem; font-weight: 800; }
.brand-mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; background: #cbed63; color: #17352c; font-weight: 900; }
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item { display: flex; align-items: center; gap: 13px; padding: 13px 16px; border-radius: 12px; color: #52615d; font-size: 1.04rem; font-weight: 600; text-decoration: none; }
.nav-item span { min-width: 18px; text-align: center; }.nav-item:hover { background: #eef4ef; }.nav-item.router-link-exact-active { background: #dff09b; color: #17352c; font-weight: 800; }
.sidebar-card { padding: 22px; border: 1px solid #d4e4d9; border-radius: 18px; background: #e5f0e8; }
.sidebar-card-icon { margin-bottom: 14px; font-size: 1.35rem; }.sidebar-card h3 { margin: 0; font-size: 1.42rem; line-height: 1.1; }.sidebar-card p { margin: 13px 0 0; color: #536760; font-size: 1rem; line-height: 1.55; }
.logout-button { width: 100%; margin-top: 18px; padding: 12px; border: 0; background: transparent; color: #53615d; font-size: 1rem; font-weight: 750; cursor: pointer; }
.main-content { width: 100%; max-width: 1500px; margin: 0 auto; padding: 42px 50px 64px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 30px; margin-bottom: 30px; }.eyebrow { margin: 0; color: #65717f; font-size: .95rem; font-weight: 850; letter-spacing: .1em; }.topbar h1 { margin: 6px 0 8px; font-size: 2.6rem; }.topbar > div > p:last-child { margin: 0; color: #596574; font-size: 1.1rem; line-height: 1.55; }
.profile { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border: 1px solid #e1e7e3; border-radius: 999px; background: #fffefd; color: inherit; text-decoration: none; }.profile-avatar { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #cbed63; font-weight: 850; }.profile > span:last-child { display: flex; flex-direction: column; gap: 2px; }.profile strong { font-size: 1rem; }.profile small { color: #66717f; font-size: .88rem; }
.feedback { margin: 0 0 18px; padding: 13px 16px; border-radius: 12px; font-size: 1rem; font-weight: 700; }.feedback.error { background: #fff0ed; color: #a52b20; }.feedback.success { background: #e8f4c2; color: #315e51; }
.plan-summary { position: relative; margin-bottom: 22px; padding: 28px 30px; border: 1px solid #d8e5dc; border-radius: 20px; background: linear-gradient(120deg, #e4efe7, #f4f8df); display: grid; grid-template-columns: 1fr auto; gap: 20px; overflow: hidden; }.plan-summary h2 { margin: 7px 0 8px; font-size: 1.65rem; }.plan-summary > div > p:last-child { margin: 0; color: #52615d; font-size: 1.02rem; }.progress-score { width: 94px; height: 94px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 8px solid #cbed63; border-radius: 50%; background: #fffefd; }.progress-score strong { font-size: 1.4rem; }.progress-score span { color: #61706b; font-size: .82rem; font-weight: 700; }.progress-track { grid-column: 1 / -1; height: 10px; border-radius: 999px; background: rgba(23, 63, 52, .1); overflow: hidden; }.progress-track span { display: block; height: 100%; border-radius: inherit; background: #79a337; transition: width .3s ease; }
.plan-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.day-card { padding: 23px; border: 1px solid #dfe7e2; border-radius: 18px; background: #fffefd; box-shadow: 0 8px 20px rgba(31, 53, 45, .035); }.day-card.today { border-color: #93b04a; box-shadow: 0 0 0 3px rgba(203, 237, 99, .25); }.day-card.completed { background: #f3f8e5; }.day-heading { display: flex; align-items: center; gap: 14px; }.day-number { width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center; border-radius: 14px; background: #e6eee9; color: #315e51; font-size: .95rem; font-weight: 900; }.completed .day-number { background: #cbed63; color: #17352c; }.day-heading p { margin: 0 0 4px; color: #63716c; font-size: .84rem; font-weight: 850; letter-spacing: .08em; }.day-heading p span { margin-left: 8px; padding: 3px 7px; border-radius: 999px; background: #cbed63; color: #17352c; font-size: .7rem; letter-spacing: .04em; }.day-heading h2 { margin: 0; font-size: 1.3rem; }.day-details { min-height: 74px; margin: 18px 0; color: #465852; font-size: 1.02rem; line-height: 1.6; }.day-actions { display: flex; flex-wrap: wrap; gap: 9px; }.day-actions a, .day-actions button { padding: 10px 13px; border-radius: 10px; font: inherit; font-size: .92rem; font-weight: 800; cursor: pointer; text-decoration: none; }.day-actions a { background: #173f34; color: white; }.day-actions button { border: 1px solid #b8c9be; background: white; color: #315e51; }.day-actions button:disabled { opacity: .6; cursor: wait; }
.plan-footer { margin-top: 22px; padding: 25px 28px; border: 1px solid #e1e7e3; border-radius: 18px; background: #fffefd; display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; }.plan-footer h2 { margin: 0 0 7px; font-size: 1.35rem; }.plan-footer p { margin: 0; color: #596a64; font-size: 1rem; line-height: 1.5; }.footer-actions { display: flex; gap: 9px; }.footer-actions a, .footer-actions button, .delete-confirmation button { padding: 11px 15px; border-radius: 10px; font: inherit; font-size: .93rem; font-weight: 800; cursor: pointer; text-decoration: none; }.regenerate-link { background: #cbed63; color: #17352c; }.delete-button { border: 1px solid #e1b4ad; background: #fff; color: #a33b31; }.delete-confirmation { grid-column: 1 / -1; padding: 16px; border-radius: 13px; background: #fff0ed; display: flex; align-items: center; gap: 10px; }.delete-confirmation p { margin-right: auto; display: flex; flex-direction: column; color: #7e322b; }.delete-confirmation button { border: 1px solid #d8c2be; background: white; color: #5b4c49; }.delete-confirmation .confirm-delete { border-color: #a33b31; background: #a33b31; color: white; }
.empty-card { min-height: 430px; padding: 50px 28px; border: 1px solid #dfe7e2; border-radius: 20px; background: #fffefd; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }.empty-icon { width: 72px; height: 72px; margin-bottom: 20px; display: grid; place-items: center; border-radius: 22px; background: #e8f4c2; color: #315e51; font-size: 1.8rem; }.empty-card h2 { margin: 8px 0 10px; font-size: 1.7rem; }.empty-card > p:not(.eyebrow) { max-width: 600px; margin: 0; color: #596a64; font-size: 1.05rem; line-height: 1.6; }.empty-card a { margin-top: 22px; padding: 13px 18px; border-radius: 11px; background: #cbed63; color: #17352c; font-size: 1rem; font-weight: 850; text-decoration: none; }
@media (max-width: 1000px) { .app-shell { grid-template-columns: 1fr; }.sidebar { display: none; } }
@media (max-width: 760px) { .main-content { padding: 26px 16px 44px; }.profile { display: none; }.plan-grid { grid-template-columns: 1fr; }.plan-summary { padding: 23px; }.progress-score { width: 82px; height: 82px; }.plan-footer { grid-template-columns: 1fr; }.footer-actions { flex-wrap: wrap; }.delete-confirmation { flex-wrap: wrap; }.delete-confirmation p { width: 100%; }.day-details { min-height: 0; } }
</style>
