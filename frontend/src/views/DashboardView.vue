<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { signOut, fetchAuthSession } from 'aws-amplify/auth'

const router = useRouter()

// Store workout data loaded from the backend.
const workouts = ref([])

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
onMounted(() => {
  loadWorkouts()
})
</script>

<template>
  <main class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-mark">F</div>
          <span>FitCloud</span>
        </div>

        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item active">
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
          <p>Here is an overview of your FitCloud activity.</p>
        </div>

        <div class="profile">
          <div class="profile-avatar">A</div>

          <div>
            <strong>My Account</strong>
            <p>FitCloud Member</p>
          </div>
        </div>
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
          <p class="motivation-label">FITCLOUD DAILY</p>

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
  grid-template-columns: 230px 1fr;
  background: #f4f6f8;
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
  padding: 32px 22px;
  background: #fffefd;
  border-right: 1px solid #ebedf0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
  font-size: 1.25rem;
  font-weight: 800;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e2f58b;
  display: grid;
  place-items: center;
  font-weight: 900;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: #68707d;
  font-size: 0.92rem;
  font-weight: 500;
}

.nav-item:hover {
  background: #f2f4f6;
}

.nav-item.active {
  background: #e4f58f;
  color: #172033;
  font-weight: 700;
}

.sidebar-card {
  padding: 18px;
  border-radius: 18px;
  background: #d7ebf8;
}

.sidebar-card-icon {
  font-size: 1.35rem;
  margin-bottom: 14px;
}

.sidebar-card h3 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.08;
}

.sidebar-card p {
  margin: 12px 0 0;
  color: #657180;
  font-size: 0.78rem;
  line-height: 1.5;
}

.logout-button {
  width: 100%;
  margin-top: 18px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #68707d;
  font-weight: 600;
  cursor: pointer;
}

.logout-button:hover {
  background: #f2f4f6;
}

/* Main */

.main-content {
  padding: 34px 42px 50px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.welcome-label {
  margin: 0 0 7px !important;
  font-size: 0.72rem !important;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #8a929f !important;
}

.topbar h1 {
  margin: 0;
  font-size: 2rem;
}

.topbar > div > p {
  margin: 7px 0 0;
  color: #7a8391;
  font-size: 0.9rem;
}

.profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: 999px;
  background: #fffefd;
  border: 1px solid #e7e9ed;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e2f58b;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.profile strong {
  font-size: 0.85rem;
}

.profile p {
  margin: 2px 0 0;
  font-size: 0.72rem;
  color: #8b93a0;
}

/* Summary */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 22px;
}

.summary-card {
  min-height: 155px;
  border-radius: 20px;
  padding: 22px;
}

.summary-card > p {
  margin: 0 0 22px;
  font-size: 0.8rem;
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
  font-size: 0.78rem;
}

.blue-card {
  background: #d8ecf8;
}

.yellow-card {
  background: #fff1a8;
}

.lime-card {
  background: #e2f58b;
}

/* Features */

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.feature-card {
  position: relative;
  min-height: 220px;
  padding: 24px;
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
  width: 45px;
  height: 45px;
  margin-bottom: 32px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  font-weight: 800;
}

.blue-icon {
  background: #d8ecf8;
}

.yellow-icon {
  background: #fff1a8;
}

.lime-icon {
  background: #e2f58b;
}

.feature-card h2 {
  margin: 0;
  font-size: 1.08rem;
}

.feature-card p {
  margin: 9px 0 0;
  color: #79828f;
  font-size: 0.82rem;
  line-height: 1.55;
}

.arrow {
  position: absolute;
  right: 22px;
  bottom: 20px;
  font-size: 1.1rem;
}

/* Motivation */

.motivation-card {
  margin-top: 22px;
  padding: 28px;
  border-radius: 20px;
  background: #172033;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.motivation-label {
  margin: 0 0 10px;
  color: #d7dfeb;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.motivation-card h2 {
  margin: 0;
  font-size: 1.4rem;
}

.motivation-card > div > p:last-child {
  margin: 10px 0 0;
  max-width: 600px;
  color: #c9d0dc;
  font-size: 0.83rem;
  line-height: 1.5;
}

.start-button {
  flex-shrink: 0;
  padding: 12px 18px;
  border-radius: 12px;
  background: #e2f58b;
  color: #172033;
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
}

.summary-value {
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
}

.summary-date {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
}
</style>