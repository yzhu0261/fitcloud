<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { RouterLink, useRouter } from 'vue-router'

const API_URL = 'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com'

const router = useRouter()
const workouts = ref([])
const nutrition = ref([])
const isLoading = ref(true)
const loadError = ref('')

const numberValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatDate = (date) => {
  if (!date) return 'Date unavailable'

  const parsed = new Date(`${date}T00:00:00`)

  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(parsed)
}

const sortedWorkouts = computed(() => {
  return [...workouts.value].sort((a, b) =>
    String(b.date ?? '').localeCompare(String(a.date ?? '')),
  )
})

const sortedNutrition = computed(() => {
  return [...nutrition.value].sort((a, b) =>
    String(b.date ?? '').localeCompare(String(a.date ?? '')),
  )
})

const totalExercises = computed(() => {
  return workouts.value.reduce(
    (total, workout) => total + (workout.exercises?.length ?? 0),
    0,
  )
})

const totalVolume = computed(() => {
  const volume = workouts.value.reduce((workoutTotal, workout) => {
    return (
      workoutTotal +
      (workout.exercises ?? []).reduce((exerciseTotal, exercise) => {
        return (
          exerciseTotal +
          numberValue(exercise.sets) *
            numberValue(exercise.reps) *
            numberValue(exercise.weight)
        )
      }, 0)
    )
  }, 0)

  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(
    volume,
  )
})

const nutritionTotals = (record) => {
  return (record.foods ?? []).reduce(
    (totals, food) => ({
      calories: totals.calories + numberValue(food.calories),
      protein: totals.protein + numberValue(food.protein),
      carbs: totals.carbs + numberValue(food.carbs),
      fat: totals.fat + numberValue(food.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

const averageCalories = computed(() => {
  if (nutrition.value.length === 0) return 0

  const calories = nutrition.value.reduce(
    (total, record) => total + nutritionTotals(record).calories,
    0,
  )

  return Math.round(calories / nutrition.value.length)
})

const recentWorkouts = computed(() => sortedWorkouts.value.slice(0, 4))
const recentNutrition = computed(() => sortedNutrition.value.slice(0, 4))

const loadProgress = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Your session has expired. Please sign in again.')
    }

    const [workoutResponse, nutritionResponse] = await Promise.all([
      fetch(`${API_URL}/workouts`, {
        headers: { Authorization: `Bearer ${idToken}` },
      }),
      fetch(`${API_URL}/nutrition`, {
        headers: { Authorization: idToken },
      }),
    ])

    if (!workoutResponse.ok || !nutritionResponse.ok) {
      throw new Error('We could not load all of your progress data.')
    }

    const [workoutResult, nutritionResult] = await Promise.all([
      workoutResponse.json(),
      nutritionResponse.json(),
    ])

    workouts.value = Array.isArray(workoutResult)
      ? workoutResult
      : (workoutResult.workouts ?? [])
    nutrition.value = Array.isArray(nutritionResult)
      ? nutritionResult
      : (nutritionResult.nutrition ?? [])
  } catch (error) {
    loadError.value = error.message || 'Something went wrong while loading progress.'
  } finally {
    isLoading.value = false
  }
}

const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

onMounted(loadProgress)
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-mark">F</div>
          <span>FitCloud</span>
        </div>

        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item"><span>▦</span> Dashboard</RouterLink>
          <RouterLink to="/workout" class="nav-item"><span>◫</span> Workout</RouterLink>
          <RouterLink to="/nutrition" class="nav-item"><span>◉</span> Nutrition</RouterLink>
          <RouterLink to="/progress" class="nav-item"><span>⌁</span> Progress</RouterLink>
        </nav>
      </div>

      <div>
        <div class="sidebar-card">
          <div class="sidebar-card-icon">✦</div>
          <h3>Train.<br />Track.<br />Improve.</h3>
          <p>Your saved activity turns consistency into visible progress.</p>
        </div>
        <button type="button" class="logout-button" @click="handleLogout">Logout</button>
      </div>
    </aside>

    <section class="main-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">YOUR JOURNEY</p>
          <h1>Progress</h1>
          <p>See how your training and nutrition are building over time.</p>
        </div>
        <div class="profile">
          <div class="profile-avatar">A</div>
          <div><strong>My Account</strong><p>FitCloud Member</p></div>
        </div>
      </header>

      <div v-if="isLoading" class="state-card">
        <div class="spinner"></div>
        <p>Loading your progress...</p>
      </div>

      <div v-else-if="loadError" class="state-card error-state">
        <strong>Progress could not be loaded</strong>
        <p>{{ loadError }}</p>
        <button type="button" class="retry-button" @click="loadProgress">Try again</button>
      </div>

      <template v-else>
        <section class="summary-grid">
          <article class="summary-card blue-card">
            <p>Total Workouts</p><strong>{{ workouts.length }}</strong><span>sessions completed</span>
          </article>
          <article class="summary-card yellow-card">
            <p>Total Exercises</p><strong>{{ totalExercises }}</strong><span>movements recorded</span>
          </article>
          <article class="summary-card lime-card">
            <p>Training Volume</p><strong>{{ totalVolume }}</strong><span>kg lifted in total</span>
          </article>
          <article class="summary-card pink-card">
            <p>Average Calories</p><strong>{{ averageCalories }}</strong><span>kcal per saved day</span>
          </article>
        </section>

        <section class="history-grid">
          <article class="content-card">
            <div class="card-heading">
              <div><p class="eyebrow">TRAINING</p><h2>Recent Workouts</h2></div>
              <RouterLink to="/workout">Add workout →</RouterLink>
            </div>

            <div v-if="recentWorkouts.length === 0" class="empty-state">
              <span>◫</span><strong>No workouts yet</strong><p>Your saved workouts will appear here.</p>
            </div>

            <div v-else class="record-list">
              <div v-for="(workout, index) in recentWorkouts" :key="workout.workoutId ?? index" class="record-item">
                <div class="date-badge">{{ formatDate(workout.date) }}</div>
                <div class="record-details">
                  <strong>{{ workout.exercises?.length ?? 0 }} exercises</strong>
                  <p>{{ (workout.exercises ?? []).map((item) => item.exercise).filter(Boolean).join(' · ') || 'Workout session' }}</p>
                </div>
              </div>
            </div>
          </article>

          <article class="content-card">
            <div class="card-heading">
              <div><p class="eyebrow">NUTRITION</p><h2>Recent Nutrition</h2></div>
              <RouterLink to="/nutrition">Add meal →</RouterLink>
            </div>

            <div v-if="recentNutrition.length === 0" class="empty-state">
              <span>◉</span><strong>No nutrition records yet</strong><p>Your saved meals will appear here.</p>
            </div>

            <div v-else class="record-list">
              <div v-for="(record, index) in recentNutrition" :key="record.nutritionId ?? index" class="record-item">
                <div class="date-badge">{{ formatDate(record.date) }}</div>
                <div class="record-details nutrition-details">
                  <strong>{{ nutritionTotals(record).calories }} kcal</strong>
                  <p>P {{ nutritionTotals(record).protein }}g · C {{ nutritionTotals(record).carbs }}g · F {{ nutritionTotals(record).fat }}g</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 230px 1fr; background: #f4f6f8; color: #172033; font-family: Inter, Arial, Helvetica, sans-serif; }
.sidebar { min-height: 100vh; padding: 32px 22px; background: #fffefd; border-right: 1px solid #ebedf0; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; font-size: 1.25rem; font-weight: 800; }
.brand-mark { width: 34px; height: 34px; border-radius: 10px; background: #e2f58b; display: grid; place-items: center; font-weight: 900; }
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 12px; text-decoration: none; color: #68707d; font-size: .92rem; font-weight: 500; }
.nav-item:hover { background: #f2f4f6; }
.nav-item.router-link-exact-active { background: #e4f58f; color: #172033; font-weight: 700; }
.sidebar-card { padding: 18px; border-radius: 18px; background: #d7ebf8; }
.sidebar-card-icon { margin-bottom: 14px; font-size: 1.35rem; }
.sidebar-card h3 { margin: 0; font-size: 1.25rem; line-height: 1.08; }
.sidebar-card p { margin: 12px 0 0; color: #657180; font-size: .78rem; line-height: 1.5; }
.logout-button { width: 100%; margin-top: 18px; padding: 10px; border: 0; border-radius: 10px; background: transparent; color: #68707d; font-weight: 600; cursor: pointer; }
.logout-button:hover { background: #f2f4f6; }
.main-content { width: 100%; max-width: 1400px; margin: 0 auto; padding: 34px 42px 50px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
.topbar h1 { margin: 4px 0 6px; font-size: 2rem; }
.topbar > div > p:last-child { margin: 0; color: #7a8391; font-size: .9rem; }
.eyebrow { margin: 0; color: #8a929f; font-size: .72rem; font-weight: 800; letter-spacing: .1em; }
.profile { display: flex; align-items: center; gap: 12px; padding: 9px 14px; border: 1px solid #e7e9ed; border-radius: 999px; background: #fffefd; }
.profile-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e2f58b; display: grid; place-items: center; font-weight: 800; }
.profile strong { font-size: .85rem; }
.profile p { margin: 2px 0 0; color: #8b93a0; font-size: .72rem; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 22px; }
.summary-card { min-height: 155px; padding: 22px; border-radius: 20px; }
.summary-card p { margin: 0 0 19px; font-size: .8rem; font-weight: 700; }
.summary-card strong { display: block; font-size: 2.15rem; line-height: 1; }
.summary-card span { display: block; margin-top: 10px; color: #66717f; font-size: .78rem; }
.blue-card { background: #d8ecf8; } .yellow-card { background: #fff1a8; } .lime-card { background: #e2f58b; } .pink-card { background: #f6dfe7; }
.history-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
.content-card, .state-card { padding: 22px; border: 1px solid #e7e9ec; border-radius: 20px; background: #fffefd; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.card-heading h2 { margin: 5px 0 0; font-size: 1.12rem; }
.card-heading a { color: #526274; font-size: .78rem; font-weight: 700; text-decoration: none; }
.record-item { display: flex; gap: 16px; padding: 17px 0; border-top: 1px solid #edf0f2; }
.date-badge { width: 92px; flex: 0 0 92px; color: #68707d; font-size: .75rem; font-weight: 700; }
.record-details { min-width: 0; }
.record-details strong { font-size: .9rem; }
.record-details p { margin: 6px 0 0; overflow: hidden; color: #7d8693; font-size: .78rem; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.nutrition-details strong { color: #43541c; }
.empty-state { min-height: 220px; display: grid; place-items: center; align-content: center; gap: 7px; color: #8b93a0; text-align: center; }
.empty-state > span { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: #f1f3f5; }
.empty-state strong { color: #596272; font-size: .9rem; }
.empty-state p { margin: 0; font-size: .78rem; }
.state-card { min-height: 260px; display: grid; place-items: center; align-content: center; gap: 12px; color: #68707d; text-align: center; }
.state-card p { margin: 0; }
.spinner { width: 34px; height: 34px; border: 3px solid #e5e9ed; border-top-color: #95ad31; border-radius: 50%; animation: spin .8s linear infinite; }
.error-state strong { color: #a52b20; }
.retry-button { padding: 10px 16px; border: 0; border-radius: 10px; background: #e2f58b; color: #172033; font-weight: 700; cursor: pointer; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1100px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 900px) { .app-shell { grid-template-columns: 1fr; } .sidebar { display: none; } .history-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .main-content { padding: 24px 16px 40px; } .profile { display: none; } .summary-grid { grid-template-columns: 1fr; } .date-badge { width: 80px; flex-basis: 80px; } }
</style>
