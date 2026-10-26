<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { signOut, fetchAuthSession } from 'aws-amplify/auth'
import {
  getTodayPlanDay,
  loadWeeklyPlan,
  weeklyPlanUpdatedEvent,
} from '../services/weeklyPlan'

const router = useRouter()

// Store workout data loaded from the backend.
const workouts = ref([])
const weeklyPlan = ref(null)
const todayPlan = computed(() => getTodayPlanDay(weeklyPlan.value))

// Sign the current user out and return to the login page.
const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

// Load the current user's workout history from the backend.
const loadWorkouts = async () => {
  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()

  const response = await fetch(
    'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com/workouts',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  )

  const data = await response.json()

  workouts.value = data

  console.log('Dashboard workouts:', workouts.value)
}

// Calculate the total number of exercises across all saved workouts.
const totalExercises = computed(() => {
  return workouts.value.reduce((total, workout) => {
    return total + workout.exercises.length
  }, 0)
})

// Find the date of the most recently saved workout.
const latestWorkout = computed(() => {
  if (workouts.value.length === 0) {
    return 'No workouts'
  }

  const dates = workouts.value.map((workout) => workout.date)

  return dates.sort().reverse()[0]
})

// Load workout data when the Dashboard page opens.
const refreshWeeklyPlan = async (event) => {
  weeklyPlan.value = event?.detail || (await loadWeeklyPlan())
}

onMounted(() => {
  loadWorkouts()
  refreshWeeklyPlan()
  window.addEventListener(weeklyPlanUpdatedEvent, refreshWeeklyPlan)
})

onUnmounted(() => {
  window.removeEventListener(weeklyPlanUpdatedEvent, refreshWeeklyPlan)
})
</script>

<template>
  <main class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-mark">R</div>
          <span>RepVelta</span>
        </div>

        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item">
            <span>▦</span>
            Dashboard
          </RouterLink>

          <RouterLink to="/workout" class="nav-item">
            <span>◫</span>
            Workout
          </RouterLink>

          <RouterLink to="/nutrition" class="nav-item">
            <span>◉</span>
            Nutrition
          </RouterLink>

          <RouterLink to="/progress" class="nav-item">
            <span>⌁</span>
            Progress
          </RouterLink>

          <RouterLink to="/coach" class="nav-item">
            <span>✦</span>
            AI Coach
          </RouterLink>

          <RouterLink to="/account" class="nav-item">
            <span>●</span>
            My Account
          </RouterLink>
        </nav>
      </div>

      <div>
        <div class="sidebar-card">
          <div class="sidebar-card-icon">✦</div>

          <h3>
            Train.<br />
            Track.<br />
            Improve.
          </h3>

          <p>
            Build better habits and keep your progress in one place.
          </p>
        </div>

        <button
          type="button"
          class="logout-button"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <section class="main-content">
      <header class="topbar">
        <div>
          <p class="welcome-label">WELCOME BACK</p>
          <h1>Dashboard</h1>
          <p>Here is an overview of your RepVelta activity.</p>
        </div>

        <RouterLink to="/account" class="profile">
          <div class="profile-avatar">A</div>

          <div>
            <strong>My Account</strong>
            <p>RepVelta Member</p>
          </div>
        </RouterLink>
      </header>

      <!-- Display a summary of the user's workout activity. -->
      <section class="summary-grid">
        <article class="summary-card blue-card">
          <p>Total Workouts</p>

          <div class="summary-value">
            {{ workouts.length }}
          </div>

          <span>Training sessions saved</span>
        </article>

        <article class="summary-card yellow-card">
          <p>Total Exercises</p>

          <div class="summary-value">
            {{ totalExercises }}
          </div>

          <span>Exercises recorded</span>
        </article>

        <article class="summary-card lime-card">
          <p>Latest Workout</p>

          <div class="summary-date">
            {{ latestWorkout }}
          </div>

          <span>Most recent session</span>
        </article>
      </section>

      <section v-if="weeklyPlan" class="ai-plan-card">
        <div class="ai-plan-icon">✦</div>
        <div class="ai-plan-copy">
          <p class="ai-plan-label">TODAY’S AI PLAN</p>
          <h2>{{ todayPlan ? `Day ${todayPlan.dayNumber}` : 'Weekly plan saved' }}</h2>
          <p v-if="todayPlan">{{ todayPlan.details }}</p>
          <p v-else>Your saved plan covers {{ weeklyPlan.startDate }} to {{ weeklyPlan.endDate }}. Ask your coach to create a new plan when you are ready.</p>
        </div>
        <div class="ai-plan-actions">
          <RouterLink v-if="todayPlan" to="/workout?fromPlan=1" class="plan-primary-action">Start workout</RouterLink>
          <RouterLink to="/coach" class="plan-secondary-action">View plan</RouterLink>
        </div>
      </section>

      <!-- Main actions -->
      <section class="feature-grid">
        <RouterLink to="/workout" class="feature-card">
          <div class="feature-icon blue-icon">◫</div>

          <div>
            <h2>Today's Workout</h2>
            <p>
              Add exercises, record sets and reps, and save your workout.
            </p>
          </div>

          <span class="arrow">→</span>
        </RouterLink>

        <RouterLink to="/nutrition" class="feature-card">
          <div class="feature-icon yellow-icon">◉</div>

          <div>
            <h2>Nutrition</h2>
            <p>
              Track meals and keep your nutrition information organised.
            </p>
          </div>

          <span class="arrow">→</span>
        </RouterLink>

        <RouterLink to="/progress" class="feature-card">
          <div class="feature-icon lime-icon">⌁</div>

          <div>
            <h2>Progress</h2>
            <p>
              Review your training history and monitor your progress.
            </p>
          </div>

          <span class="arrow">→</span>
        </RouterLink>
      </section>

      <!-- Motivation card -->
      <section class="motivation-card">
        <div>
          <p class="motivation-label">REPVELTA DAILY</p>

          <h2>Small progress is still progress.</h2>

          <p>
            Stay consistent, keep tracking, and let your data show how far
            you've come.
          </p>
        </div>

        <RouterLink to="/workout" class="start-button">
          Start Workout
        </RouterLink>
      </section>
    </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 270px 1fr;
  background: #f1f5f2;
  color: #172033;
  font-family:
    Inter,
    Arial,
    Helvetica,
    sans-serif;
}

/* Sidebar */

.sidebar {
  min-height: 100vh;
  padding: 36px 28px;
  background: #fffefd;
  border-right: 1px solid #dfe8e2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 46px;
  font-size: 1.5rem;
  font-weight: 800;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #cbed63;
  color: #17352c;
  display: grid;
  place-items: center;
  font-weight: 900;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #52615d;
  font-size: 1.06rem;
  font-weight: 500;
}

.nav-item:hover {
  background: #eef4ef;
}

.nav-item.router-link-exact-active {
  background: #dff09b;
  color: #17352c;
  font-weight: 700;
}

.sidebar-card {
  padding: 22px;
  border-radius: 18px;
  background: #e5f0e8;
  border: 1px solid #d4e4d9;
}

.sidebar-card-icon {
  font-size: 1.35rem;
  margin-bottom: 14px;
}

.sidebar-card h3 {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.08;
}

.sidebar-card p {
  margin: 12px 0 0;
  color: #536760;
  font-size: 1rem;
  line-height: 1.55;
}

.logout-button {
  width: 100%;
  margin-top: 18px;
  min-height: 48px;
  padding: 13px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #52615d;
  font-size: 1.12rem;
  font-weight: 700;
  cursor: pointer;
}

.logout-button:hover {
  background: #eef4ef;
}

/* Main */

.main-content {
  padding: 42px 50px 60px;
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 34px;
}

.welcome-label {
  margin: 0 0 7px !important;
  font-size: 0.9rem !important;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #8a929f !important;
}

.topbar h1 {
  margin: 0;
  font-size: 2.6rem;
}

.topbar > div > p {
  margin: 7px 0 0;
  color: #7a8391;
  font-size: 1.1rem;
}

.profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-radius: 999px;
  background: #fffefd;
  border: 1px solid #e7e9ed;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.profile:hover {
  border-color: #b8ca75;
  transform: translateY(-1px);
}

.profile-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e2f58b;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.profile strong {
  font-size: 1rem;
}

.profile p {
  margin: 2px 0 0;
  font-size: 0.88rem;
  color: #8b93a0;
}

/* Summary */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  min-height: 180px;
  border-radius: 20px;
  padding: 26px;
}

.summary-card > p {
  margin: 0 0 26px;
  font-size: 1.02rem;
  font-weight: 700;
}

.summary-card h2 {
  margin: 0;
  font-size: 1.35rem;
}

.summary-card span {
  display: block;
  margin-top: 8px;
  color: #66717f;
  font-size: 0.95rem;
}

.blue-card {
  background: #dcefea;
}

.yellow-card {
  background: #fff1a8;
}

.lime-card {
  background: #e2f58b;
}

.ai-plan-card {
  margin-bottom: 24px;
  padding: 24px 26px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  border: 1px solid #cdddb2;
  border-radius: 20px;
  background: linear-gradient(135deg, #eef6dc 0%, #e4f0e9 100%);
}

.ai-plan-icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; background: #cbed63; color: #17352c; font-size: 1.35rem; font-weight: 900; }
.ai-plan-label { margin: 0 0 6px; color: #527064; font-size: .85rem; font-weight: 850; letter-spacing: .09em; }
.ai-plan-copy h2 { margin: 0; font-size: 1.4rem; }
.ai-plan-copy > p:last-child { margin: 7px 0 0; color: #52615d; font-size: 1rem; line-height: 1.55; }
.ai-plan-actions { display: flex; gap: 9px; }
.ai-plan-actions a { padding: 12px 16px; border-radius: 11px; font-size: .95rem; font-weight: 800; text-decoration: none; white-space: nowrap; }
.plan-primary-action { background: #173f34; color: #fff; }
.plan-secondary-action { border: 1px solid #bfd0c5; background: #fffefd; color: #315e51; }

/* Features */

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-card {
  position: relative;
  min-height: 250px;
  padding: 28px;
  border: 1px solid #e7e9ec;
  border-radius: 20px;
  background: #fffefd;
  color: #172033;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(23, 32, 51, 0.07);
}

.feature-icon {
  width: 52px;
  height: 52px;
  margin-bottom: 32px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  font-weight: 800;
}

.blue-icon {
  background: #dcefea;
}

.yellow-icon {
  background: #fff1a8;
}

.lime-icon {
  background: #e2f58b;
}

.feature-card h2 {
  margin: 0;
  font-size: 1.35rem;
}

.feature-card p {
  margin: 9px 0 0;
  color: #79828f;
  font-size: 1.02rem;
  line-height: 1.6;
}

.arrow {
  position: absolute;
  right: 22px;
  bottom: 20px;
  font-size: 1.35rem;
}

/* Motivation */

.motivation-card {
  margin-top: 24px;
  padding: 34px;
  border-radius: 20px;
  background: linear-gradient(135deg, #245247 0%, #34705c 100%);
  border: 1px solid rgba(203, 237, 99, 0.18);
  box-shadow: 0 16px 32px rgba(36, 82, 71, 0.14);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.motivation-label {
  margin: 0 0 10px;
  color: #cbed63;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.motivation-card h2 {
  margin: 0;
  font-size: 1.8rem;
}

.motivation-card > div > p:last-child {
  margin: 10px 0 0;
  max-width: 600px;
  color: #e2eee8;
  font-size: 1.05rem;
  line-height: 1.55;
}

.start-button {
  flex-shrink: 0;
  padding: 14px 22px;
  border-radius: 12px;
  background: #cbed63;
  color: #17352c;
  font-size: 1.05rem;
  text-decoration: none;
  font-weight: 800;
}

/* Responsive */

@media (max-width: 1000px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .summary-grid,
  .feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .main-content {
    padding: 24px 16px 40px;
  }

  .profile {
    display: none;
  }

  .motivation-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .ai-plan-card { grid-template-columns: auto 1fr; }
  .ai-plan-actions { grid-column: 1 / -1; }
}

.summary-value {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.summary-date {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.2;
}
</style>
