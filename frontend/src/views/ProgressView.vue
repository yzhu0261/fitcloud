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

const muscleGroupColours = {
  chest: '#ef6a4c',
  back: '#4f86e8',
  legs: '#9b51e0',
  shoulders: '#e0a11d',
  arms: '#22a897',
  core: '#7da23a',
  other: '#7d8b94',
}

const muscleGroupBreakdown = computed(() => {
  const groups = workouts.value.reduce((result, workout) => {
    for (const exercise of workout.exercises ?? []) {
      const group = String(exercise.muscleGroup || 'other').trim().toLowerCase()
      result[group] = (result[group] || 0) + 1
    }

    return result
  }, {})
  const total = Object.values(groups).reduce((sum, count) => sum + count, 0)

  return Object.entries(groups)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
      colour: muscleGroupColours[name] || muscleGroupColours.other,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const formatMuscleGroup = (group) =>
  group
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const personalBests = computed(() => {
  const records = new Map()

  for (const workout of workouts.value) {
    for (const exercise of workout.exercises ?? []) {
      const name = String(exercise.exercise || '').trim()
      const weight = numberValue(exercise.weight)

      if (!name || weight <= 0) continue

      const key = name.toLowerCase()
      const candidate = {
        name,
        weight,
        reps: numberValue(exercise.reps),
        sets: numberValue(exercise.sets),
        date: workout.date,
      }
      const current = records.get(key)

      if (
        !current ||
        candidate.weight > current.weight ||
        (candidate.weight === current.weight && candidate.reps > current.reps)
      ) {
        records.set(key, candidate)
      }
    }
  }

  return [...records.values()]
    .sort((a, b) => b.weight - a.weight || b.reps - a.reps || a.name.localeCompare(b.name))
    .slice(0, 5)
})

const trainingStreak = computed(() => {
  const dates = [...new Set(workouts.value.map((workout) => workout.date).filter(Boolean))]
    .map((date) => new Date(`${date}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b)

  if (dates.length === 0) return { current: 0, longest: 0, latest: '' }

  let longest = 1
  let running = 1

  for (let index = 1; index < dates.length; index += 1) {
    const difference = Math.round((dates[index] - dates[index - 1]) / 86400000)

    if (difference === 1) {
      running += 1
      longest = Math.max(longest, running)
    } else if (difference > 1) {
      running = 1
    }
  }

  const today = new Date(`${toLocalDate(new Date())}T00:00:00`)
  const latestDate = dates.at(-1)
  const daysSinceLatestWorkout = Math.round((today - latestDate) / 86400000)

  return {
    current: daysSinceLatestWorkout >= 0 && daysSinceLatestWorkout <= 1 ? running : 0,
    longest,
    latest: toLocalDate(latestDate),
  }
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

        <section class="balance-card" aria-labelledby="training-balance-heading">
          <div class="balance-heading">
            <div>
              <p class="eyebrow">TRAINING MIX</p>
              <h2 id="training-balance-heading">Body areas trained</h2>
              <p>See how your recorded movements are distributed across muscle groups.</p>
            </div>
            <span>{{ totalExercises }} recorded movements</span>
          </div>

          <div v-if="muscleGroupBreakdown.length" class="balance-grid">
            <article v-for="group in muscleGroupBreakdown" :key="group.name" class="balance-item">
              <div class="balance-label">
                <span class="group-dot" :style="{ background: group.colour }"></span>
                <strong>{{ formatMuscleGroup(group.name) }}</strong>
                <span>{{ group.count }} · {{ group.percentage }}%</span>
              </div>
              <div
                class="balance-track"
                role="progressbar"
                :aria-label="`${formatMuscleGroup(group.name)}: ${group.percentage}%`"
                :aria-valuenow="group.percentage"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span :style="{ width: `${group.percentage}%`, background: group.colour }"></span>
              </div>
            </article>
          </div>

          <div v-else class="balance-empty">
            Save a workout to see your training balance.
          </div>
        </section>

        <section class="achievement-grid" aria-label="Training achievements">
          <article class="achievement-card personal-best-card">
            <div class="achievement-heading">
              <div>
                <p class="eyebrow">STRENGTH</p>
                <h2>Personal bests</h2>
              </div>
              <RouterLink to="/workout">Log a lift →</RouterLink>
            </div>

            <div v-if="personalBests.length" class="best-list">
              <div v-for="(record, index) in personalBests" :key="record.name.toLowerCase()" class="best-item">
                <span class="best-rank">{{ String(index + 1).padStart(2, '0') }}</span>
                <div>
                  <strong>{{ record.name }}</strong>
                  <p>{{ record.sets }} sets × {{ record.reps }} reps · {{ formatDate(record.date) }}</p>
                </div>
                <strong class="best-weight">{{ record.weight.toLocaleString('en-AU') }} <small>kg</small></strong>
              </div>
            </div>

            <div v-else class="achievement-empty">
              Add weight to a recorded exercise to start tracking personal bests.
            </div>
          </article>

          <article class="achievement-card streak-card">
            <div>
              <p class="eyebrow">CONSISTENCY</p>
              <h2>Training streak</h2>
              <p>Consecutive days with at least one saved workout.</p>
            </div>
            <div class="streak-number">
              <strong>{{ trainingStreak.current }}</strong>
              <span>{{ trainingStreak.current === 1 ? 'day' : 'days' }}</span>
            </div>
            <div class="streak-details">
              <div><span>Longest streak</span><strong>{{ trainingStreak.longest }} days</strong></div>
              <div><span>Last trained</span><strong>{{ trainingStreak.latest ? formatDate(trainingStreak.latest) : 'Not yet' }}</strong></div>
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
.balance-card { margin-bottom: 24px; padding: 27px; border: 1px solid #e0e7e3; border-radius: 20px; background: #fffefd; }
.balance-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.balance-heading h2 { margin: 6px 0 5px; font-size: 1.48rem; }
.balance-heading div > p:last-child { margin: 0; color: #64716d; font-size: .98rem; line-height: 1.5; }
.balance-heading > span { padding: 8px 11px; border-radius: 999px; background: #eef4ef; color: #52615d; font-size: .88rem; font-weight: 750; white-space: nowrap; }
.balance-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 34px; row-gap: 22px; }
.balance-item { min-width: 0; }
.balance-label { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 9px; margin-bottom: 9px; }
.balance-label strong { font-size: 1rem; }
.balance-label > span:last-child { color: #64716d; font-size: .9rem; font-weight: 700; }
.group-dot { width: 11px; height: 11px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(73, 88, 82, .06); }
.balance-track { height: 11px; overflow: hidden; border-radius: 999px; background: #edf1ee; }
.balance-track span { display: block; height: 100%; border-radius: inherit; transition: width .35s ease; }
.balance-empty { padding: 26px; border-radius: 14px; background: #f4f7f5; color: #64716d; text-align: center; }
.achievement-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr); gap: 22px; margin-bottom: 24px; }
.achievement-card { min-width: 0; padding: 27px; border: 1px solid #e0e7e3; border-radius: 20px; background: #fffefd; }
.achievement-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
.achievement-heading h2, .streak-card h2 { margin: 6px 0 0; font-size: 1.48rem; }
.achievement-heading a { color: #315e51; font-size: .95rem; font-weight: 800; text-decoration: none; white-space: nowrap; }
.best-list { display: grid; }
.best-item { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: center; gap: 13px; padding: 15px 0; border-top: 1px solid #edf0ee; }
.best-rank { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; background: #eef4ef; color: #64716d; font-size: .78rem; font-weight: 850; }
.best-item > div { min-width: 0; }
.best-item > div strong { display: block; overflow: hidden; font-size: 1rem; text-overflow: ellipsis; white-space: nowrap; }
.best-item p { margin: 5px 0 0; color: #68746f; font-size: .88rem; line-height: 1.4; }
.best-weight { color: #173f34; font-size: 1.22rem; white-space: nowrap; }
.best-weight small { color: #65716c; font-size: .76rem; }
.achievement-empty { margin-top: 18px; padding: 26px; border-radius: 14px; background: #f4f7f5; color: #64716d; text-align: center; }
.streak-card { position: relative; overflow: hidden; background: linear-gradient(145deg, #173f34, #285c4d); color: white; }
.streak-card::after { position: absolute; right: -55px; bottom: -70px; width: 190px; height: 190px; border: 30px solid rgba(203, 237, 99, .12); border-radius: 50%; content: ''; }
.streak-card .eyebrow { color: #cbed63; }
.streak-card > div:first-child > p:last-child { max-width: 320px; margin: 9px 0 0; color: #d6e3de; font-size: .94rem; line-height: 1.5; }
.streak-number { position: relative; z-index: 1; display: flex; align-items: baseline; gap: 9px; margin: 28px 0 30px; }
.streak-number strong { color: #cbed63; font-size: 4.7rem; line-height: .85; }
.streak-number span { color: #edf5f1; font-size: 1.08rem; font-weight: 750; }
.streak-details { position: relative; z-index: 1; display: grid; gap: 10px; }
.streak-details div { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, .16); }
.streak-details span { color: #c7d8d1; font-size: .87rem; }
.streak-details strong { font-size: .92rem; text-align: right; }
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
@media (max-width: 900px) { .app-shell { grid-template-columns: 1fr; } .sidebar { display: none; } .topbar { flex-direction: column; }.topbar-actions { width: 100%; align-items: stretch; }.export-actions button { flex: 1; }.trend-grid, .achievement-grid, .history-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .balance-grid { grid-template-columns: 1fr; }.balance-heading { flex-direction: column; }.balance-heading > span { white-space: normal; } }
@media (max-width: 600px) { .main-content { padding: 24px 16px 40px; } .profile { display: none; } .summary-grid { grid-template-columns: 1fr; } .export-actions { width: 100%; }.date-badge { width: 80px; flex-basis: 80px; }.achievement-heading { flex-direction: column; }.best-item { grid-template-columns: 34px minmax(0, 1fr); }.best-weight { grid-column: 2; } }
</style>
