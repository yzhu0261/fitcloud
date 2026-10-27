<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { RouterLink, useRouter } from 'vue-router'
import UserProfileBadge from '../components/UserProfileBadge.vue'
import BrandMark from '../components/BrandMark.vue'
import AppNavigation from '../components/AppNavigation.vue'

const API_URL = 'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com'

const router = useRouter()
const workouts = ref([])
const nutrition = ref([])
const isLoading = ref(true)
const loadError = ref('')
const showAllWorkouts = ref(false)
const showAllNutrition = ref(false)

const PREVIEW_LIMIT = 10

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

const displayedWorkouts = computed(() => {
  return showAllWorkouts.value
    ? sortedWorkouts.value
    : sortedWorkouts.value.slice(0, PREVIEW_LIMIT)
})

const displayedNutrition = computed(() => {
  return showAllNutrition.value
    ? sortedNutrition.value
    : sortedNutrition.value.slice(0, PREVIEW_LIMIT)
})

const toLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const lastSevenDays = computed(() => {
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))

    return {
      date: toLocalDate(date),
      label: new Intl.DateTimeFormat('en-AU', { weekday: 'short' }).format(date),
    }
  })
})

const trainingTrend = computed(() =>
  lastSevenDays.value.map((day) => ({
    ...day,
    value: workouts.value.filter((workout) => workout.date === day.date).length,
  })),
)

const calorieTrend = computed(() =>
  lastSevenDays.value.map((day) => ({
    ...day,
    value: nutrition.value
      .filter((record) => record.date === day.date)
      .reduce((total, record) => total + nutritionTotals(record).calories, 0),
  })),
)

const trainingTrendMaximum = computed(() =>
  Math.max(1, ...trainingTrend.value.map((day) => day.value)),
)

const calorieTrendMaximum = computed(() =>
  Math.max(1, ...calorieTrend.value.map((day) => day.value)),
)

const barHeight = (value, maximum) =>
  `${value === 0 ? 4 : Math.max(12, Math.round((value / maximum) * 100))}%`

const escapeCsvCell = (value) => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}

const exportWorkouts = () => {
  const rows = sortedWorkouts.value.flatMap((workout) =>
    (workout.exercises ?? []).map((exercise) => {
      const sets = numberValue(exercise.sets)
      const reps = numberValue(exercise.reps)
      const weight = numberValue(exercise.weight)

      return [
        workout.date,
        exercise.exercise,
        exercise.muscleGroup,
        sets,
        reps,
        weight,
        sets * reps * weight,
      ]
    }),
  )

  downloadCsv(
    `repvelta-workouts-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Date', 'Exercise', 'Muscle group', 'Sets', 'Reps', 'Weight (kg)', 'Volume (kg)'],
    rows,
  )
}

const exportNutrition = () => {
  const rows = sortedNutrition.value.flatMap((record) =>
    (record.foods ?? []).map((food) => [
      record.date,
      food.foodName,
      numberValue(food.calories),
      numberValue(food.protein),
      numberValue(food.carbs),
      numberValue(food.fat),
    ]),
  )

  downloadCsv(
    `repvelta-nutrition-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Date', 'Food', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
    rows,
  )
}

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
          <BrandMark />
          <span>RepVelta</span>
        </div>

        <AppNavigation />
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
        <div class="topbar-actions">
          <div class="export-actions" aria-label="Export progress data">
            <button type="button" :disabled="workouts.length === 0" @click="exportWorkouts">Export workouts</button>
            <button type="button" :disabled="nutrition.length === 0" @click="exportNutrition">Export nutrition</button>
          </div>
          <UserProfileBadge />
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

        <section class="trend-grid" aria-label="Seven-day progress trends">
          <article class="trend-card">
            <div class="trend-heading">
              <div><p class="eyebrow">LAST 7 DAYS</p><h2>Training activity</h2></div>
              <span>{{ trainingTrend.reduce((total, day) => total + day.value, 0) }} sessions</span>
            </div>
            <div class="bar-chart" role="img" aria-label="Training sessions saved during the last seven days">
              <div v-for="day in trainingTrend" :key="day.date" class="bar-column" :title="`${day.date}: ${day.value} session${day.value === 1 ? '' : 's'}`">
                <strong>{{ day.value }}</strong>
                <div class="bar-track"><span class="training-bar" :style="{ height: barHeight(day.value, trainingTrendMaximum) }"></span></div>
                <small>{{ day.label }}</small>
              </div>
            </div>
          </article>

          <article class="trend-card">
            <div class="trend-heading">
              <div><p class="eyebrow">LAST 7 DAYS</p><h2>Calories logged</h2></div>
              <span>Daily totals</span>
            </div>
            <div class="bar-chart" role="img" aria-label="Calories logged during the last seven days">
              <div v-for="day in calorieTrend" :key="day.date" class="bar-column" :title="`${day.date}: ${day.value} kcal`">
                <strong>{{ day.value.toLocaleString('en-AU') }}</strong>
                <div class="bar-track"><span class="calorie-bar" :style="{ height: barHeight(day.value, calorieTrendMaximum) }"></span></div>
                <small>{{ day.label }}</small>
              </div>
            </div>
          </article>
        </section>

        <section class="history-grid">
          <article class="content-card">
            <div class="card-heading">
              <div><p class="eyebrow">TRAINING</p><h2>Workout History</h2></div>
              <RouterLink to="/workout">Add workout →</RouterLink>
            </div>

            <div v-if="displayedWorkouts.length === 0" class="empty-state">
              <span>◫</span><strong>No workouts yet</strong><p>Your saved workouts will appear here.</p>
            </div>

            <div v-else class="record-list">
              <div v-for="(workout, index) in displayedWorkouts" :key="workout.workoutId ?? index" class="record-item">
                <div class="date-badge">{{ formatDate(workout.date) }}</div>
                <div class="record-details">
                  <strong>{{ workout.exercises?.length ?? 0 }} exercises</strong>
                  <p>{{ (workout.exercises ?? []).map((item) => item.exercise).filter(Boolean).join(' · ') || 'Workout session' }}</p>
                </div>
              </div>

              <div v-if="sortedWorkouts.length > PREVIEW_LIMIT" class="history-footer">
                <button type="button" class="history-toggle" @click="showAllWorkouts = !showAllWorkouts">
                  {{ showAllWorkouts ? 'Show less' : `Show all ${sortedWorkouts.length} workouts` }}
                </button>
              </div>
            </div>
          </article>

          <article class="content-card">
            <div class="card-heading">
              <div><p class="eyebrow">NUTRITION</p><h2>Nutrition History</h2></div>
              <RouterLink to="/nutrition">Add meal →</RouterLink>
            </div>

            <div v-if="displayedNutrition.length === 0" class="empty-state">
              <span>◉</span><strong>No nutrition records yet</strong><p>Your saved meals will appear here.</p>
            </div>

            <div v-else class="record-list">
              <div v-for="(record, index) in displayedNutrition" :key="record.nutritionId ?? index" class="record-item">
                <div class="date-badge">{{ formatDate(record.date) }}</div>
                <div class="record-details nutrition-details">
                  <strong>{{ nutritionTotals(record).calories }} kcal</strong>
                  <p>P {{ nutritionTotals(record).protein }}g · C {{ nutritionTotals(record).carbs }}g · F {{ nutritionTotals(record).fat }}g</p>
                </div>
              </div>

              <div v-if="sortedNutrition.length > PREVIEW_LIMIT" class="history-footer">
                <button type="button" class="history-toggle" @click="showAllNutrition = !showAllNutrition">
                  {{ showAllNutrition ? 'Show less' : `Show all ${sortedNutrition.length} nutrition records` }}
                </button>
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
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 270px 1fr; background: #f1f5f2; color: #172033; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 17px; }
.sidebar { min-height: 100vh; padding: 36px 28px; background: #fffefd; border-right: 1px solid #dfe8e2; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 46px; font-size: 1.5rem; font-weight: 800; }
.brand-mark { width: 42px; height: 42px; border-radius: 12px; background: #cbed63; color: #17352c; display: grid; place-items: center; font-size: 1.05rem; font-weight: 900; }
.nav-menu { display: flex; flex-direction: column; gap: 10px; }
.nav-item { display: flex; align-items: center; gap: 13px; padding: 14px 16px; border-radius: 12px; text-decoration: none; color: #52615d; font-size: 1.08rem; font-weight: 550; }
.nav-item span { min-width: 18px; font-size: 1.05rem; text-align: center; }
.nav-item:hover { background: #eef4ef; }
.nav-item.router-link-exact-active { background: #dff09b; color: #17352c; font-weight: 700; }
.sidebar-card { padding: 22px; border: 1px solid #d4e4d9; border-radius: 18px; background: #e5f0e8; }
.sidebar-card-icon { margin-bottom: 15px; font-size: 1.55rem; }
.sidebar-card h3 { margin: 0; font-size: 1.45rem; line-height: 1.08; }
.sidebar-card p { margin: 14px 0 0; color: #536760; font-size: 1rem; line-height: 1.6; }
.logout-button { width: 100%; min-height: 48px; margin-top: 18px; padding: 13px 16px; border: 0; border-radius: 10px; background: transparent; color: #52615d; font-size: 1.12rem; font-weight: 700; cursor: pointer; }
.logout-button:hover { background: #eef4ef; }
.main-content { width: 100%; max-width: 1500px; margin: 0 auto; padding: 42px 50px 60px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 30px; margin-bottom: 34px; }
.topbar h1 { margin: 5px 0 8px; font-size: 2.6rem; }
.topbar > div > p:last-child { margin: 0; color: #596574; font-size: 1.12rem; line-height: 1.55; }
.eyebrow { margin: 0; color: #65717f; font-size: .95rem; font-weight: 800; letter-spacing: .1em; }
.topbar-actions { display: flex; align-items: center; gap: 12px; }
.export-actions { display: flex; gap: 8px; }
.export-actions button { min-height: 44px; padding: 10px 13px; border: 1px solid #cdd9d1; border-radius: 11px; background: #fffefd; color: #315e51; font: inherit; font-size: .9rem; font-weight: 780; cursor: pointer; }
.export-actions button:hover:not(:disabled) { border-color: #9ebc49; background: #f2f7df; }
.export-actions button:disabled { opacity: .45; cursor: not-allowed; }
.profile { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border: 1px solid #e7e9ed; border-radius: 999px; background: #fffefd; color: inherit; text-decoration: none; transition: border-color .2s ease, transform .2s ease; }
.profile:hover { border-color: #b8ca75; transform: translateY(-1px); }
.profile-avatar { width: 42px; height: 42px; border-radius: 50%; background: #cbed63; display: grid; place-items: center; font-weight: 800; }
.profile strong { font-size: 1rem; }
.profile p { margin: 3px 0 0; color: #66717f; font-size: .92rem; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.summary-card { min-height: 180px; padding: 26px; border-radius: 20px; }
.summary-card p { margin: 0 0 21px; font-size: 1.02rem; font-weight: 750; }
.summary-card strong { display: block; font-size: 3rem; line-height: 1; }
.summary-card span { display: block; margin-top: 12px; color: #4f5c6b; font-size: .98rem; }
.blue-card { background: #dcefea; } .yellow-card { background: #fff1a8; } .lime-card { background: #e2f58b; } .pink-card { background: #f6dfe7; }
.trend-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-bottom: 24px; }
.trend-card { min-width: 0; padding: 26px; border: 1px solid #e0e7e3; border-radius: 20px; background: #fffefd; }
.trend-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 22px; }
.trend-heading h2 { margin: 6px 0 0; font-size: 1.45rem; }
.trend-heading > span { padding: 7px 10px; border-radius: 999px; background: #eef4ef; color: #52615d; font-size: .86rem; font-weight: 750; white-space: nowrap; }
.bar-chart { display: grid; grid-template-columns: repeat(7, minmax(38px, 1fr)); gap: 10px; height: 220px; }
.bar-column { display: grid; grid-template-rows: 24px minmax(0, 1fr) 22px; gap: 7px; min-width: 0; text-align: center; }
.bar-column strong { overflow: hidden; color: #465852; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.bar-column small { color: #6b7772; font-size: .78rem; font-weight: 700; }
.bar-track { position: relative; overflow: hidden; border-radius: 10px; background: #f0f3f1; }
.bar-track span { position: absolute; right: 0; bottom: 0; left: 0; display: block; border-radius: 10px 10px 6px 6px; transition: height .35s ease; }
.training-bar { background: linear-gradient(180deg, #cbed63, #88ad3b); }
.calorie-bar { background: linear-gradient(180deg, #ffd967, #e6a835); }
.history-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
.content-card, .state-card { padding: 26px; border: 1px solid #e7e9ec; border-radius: 20px; background: #fffefd; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.card-heading h2 { margin: 6px 0 0; font-size: 1.48rem; }
.card-heading a { color: #35495e; font-size: 1rem; font-weight: 750; text-decoration: none; }
.record-item { display: flex; gap: 18px; padding: 20px 0; border-top: 1px solid #edf0f2; }
.date-badge { width: 116px; flex: 0 0 116px; color: #4e5c6b; font-size: .95rem; font-weight: 700; }
.record-details { min-width: 0; }
.record-details strong { font-size: 1.1rem; }
.record-details p { margin: 7px 0 0; color: #586575; font-size: 1rem; line-height: 1.55; overflow-wrap: anywhere; }
.nutrition-details strong { color: #43541c; }
.empty-state { min-height: 220px; display: grid; place-items: center; align-content: center; gap: 7px; color: #8b93a0; text-align: center; }
.empty-state > span { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: #f1f3f5; }
.empty-state strong { color: #596272; font-size: 1rem; }
.empty-state p { margin: 0; font-size: 1rem; }
.history-footer { padding-top: 16px; border-top: 1px solid #edf0f2; text-align: center; }
.history-toggle { padding: 11px 17px; border: 1px solid #d8dee4; border-radius: 11px; background: #f7f9f5; color: #344538; font-size: 1rem; font-weight: 750; cursor: pointer; }
.history-toggle:hover { border-color: #b8ca75; background: #f1f7d9; }
.state-card { min-height: 260px; display: grid; place-items: center; align-content: center; gap: 12px; color: #68707d; text-align: center; }
.state-card p { margin: 0; }
.spinner { width: 34px; height: 34px; border: 3px solid #e5e9ed; border-top-color: #95ad31; border-radius: 50%; animation: spin .8s linear infinite; }
.error-state strong { color: #a52b20; }
.retry-button { padding: 11px 17px; border: 0; border-radius: 10px; background: #cbed63; color: #17352c; font-size: 1rem; font-weight: 700; cursor: pointer; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1200px) { .topbar { align-items: flex-start; }.topbar-actions { flex-direction: column-reverse; align-items: flex-end; }.summary-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 900px) { .app-shell { grid-template-columns: 1fr; } .sidebar { display: none; } .topbar { flex-direction: column; }.topbar-actions { width: 100%; align-items: stretch; }.export-actions button { flex: 1; }.trend-grid, .history-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .main-content { padding: 24px 16px 40px; } .profile { display: none; } .summary-grid { grid-template-columns: 1fr; } .export-actions { width: 100%; }.date-badge { width: 80px; flex-basis: 80px; } }
</style>
