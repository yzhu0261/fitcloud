<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { fetchAuthSession } from 'aws-amplify/auth'
import { RouterLink, useRoute } from 'vue-router'
import UserProfileBadge from '../components/UserProfileBadge.vue'
import BrandMark from '../components/BrandMark.vue'
import AppNavigation from '../components/AppNavigation.vue'
import AppIcon from '../components/AppIcon.vue'
import {
  getTodayPlanDay,
  loadWeeklyPlan,
  updateWeeklyPlanDay,
} from '../services/weeklyPlan'
import {
  clearActivityDraft,
  getActivityDraftKey,
  loadActivityDraft,
  saveActivityDraft,
} from '../services/activityDrafts'

const route = useRoute()

const EXERCISE_LIBRARY = [
  { name: 'Bench Press', group: 'chest' },
  { name: 'Incline Dumbbell Press', group: 'chest' },
  { name: 'Chest Fly', group: 'chest' },
  { name: 'Push-Up', group: 'chest' },
  { name: 'Lat Pulldown', group: 'back' },
  { name: 'Seated Cable Row', group: 'back' },
  { name: 'Barbell Row', group: 'back' },
  { name: 'Pull-Up', group: 'back' },
  { name: 'Back Squat', group: 'legs' },
  { name: 'Romanian Deadlift', group: 'legs' },
  { name: 'Leg Press', group: 'legs' },
  { name: 'Walking Lunge', group: 'legs' },
  { name: 'Dumbbell Shoulder Press', group: 'shoulders' },
  { name: 'Lateral Raise', group: 'shoulders' },
  { name: 'Face Pull', group: 'shoulders' },
  { name: 'Barbell Curl', group: 'arms' },
  { name: 'Hammer Curl', group: 'arms' },
  { name: 'Tricep Pushdown', group: 'arms' },
  { name: 'Dips', group: 'arms' },
  { name: 'Plank', group: 'core' },
  { name: 'Cable Crunch', group: 'core' },
  { name: 'Russian Twist', group: 'core' },
  { name: 'Hanging Knee Raise', group: 'core' },
]

const WORKOUT_TEMPLATES = [
  {
    id: 'full-body',
    title: 'Full body starter',
    description: 'A balanced session covering the main movement patterns.',
    exercises: [
      { muscleGroup: 'legs', exercise: 'Back Squat', sets: 3, reps: 8, weight: 0 },
      { muscleGroup: 'chest', exercise: 'Bench Press', sets: 3, reps: 10, weight: 0 },
      { muscleGroup: 'back', exercise: 'Seated Cable Row', sets: 3, reps: 10, weight: 0 },
    ],
  },
  {
    id: 'upper-body',
    title: 'Upper body',
    description: 'Push, pull, and shoulder work for an efficient upper session.',
    exercises: [
      { muscleGroup: 'chest', exercise: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 0 },
      { muscleGroup: 'back', exercise: 'Lat Pulldown', sets: 3, reps: 10, weight: 0 },
      { muscleGroup: 'shoulders', exercise: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: 0 },
    ],
  },
  {
    id: 'lower-body',
    title: 'Lower body + core',
    description: 'Leg strength with a short core finisher.',
    exercises: [
      { muscleGroup: 'legs', exercise: 'Leg Press', sets: 3, reps: 12, weight: 0 },
      { muscleGroup: 'legs', exercise: 'Romanian Deadlift', sets: 3, reps: 10, weight: 0 },
      { muscleGroup: 'core', exercise: 'Cable Crunch', sets: 3, reps: 12, weight: 0 },
    ],
  },
]

const toLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const muscleGroup = ref('')
const exercise = ref('')
const sets = ref('')
const reps = ref('')
const weight = ref('')

const exercises = ref([])
const workouts = ref([])
const weeklyPlan = ref(null)
const formError = ref('')
const saveNotice = ref('')
const templateNotice = ref('')
const isSaving = ref(false)
const isLoadingHistory = ref(true)
const historyError = ref('')
const deletingWorkoutId = ref('')
const workoutPendingDelete = ref('')
const editingWorkoutId = ref('')
const editWorkoutDraft = ref(null)
const isUpdatingWorkout = ref(false)
const todayPlan = ref(null)
const historySearch = ref('')
const historyDateFrom = ref('')
const historyDateTo = ref('')
const historyActionNotice = ref('')
const workoutDraftKey = ref('')
const workoutDraftNotice = ref('')
const today = computed(() => toLocalDate(new Date()))
const selectedWorkoutDate = ref(toLocalDate(new Date()))
const isSelectedToday = computed(() => selectedWorkoutDate.value === today.value)
const selectedDateLabel = computed(() => {
  const parsed = new Date(`${selectedWorkoutDate.value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return selectedWorkoutDate.value

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
})
const linkedPlanDay = computed(() => {
  if (route.query.fromPlan !== '1' || !weeklyPlan.value?.days) return null

  const requestedDay = Number(route.query.day)
  return Number.isInteger(requestedDay) && requestedDay > 0
    ? weeklyPlan.value.days.find((day) => day.dayNumber === requestedDay) || null
    : todayPlan.value
})
const isPlanWorkout = computed(
  () =>
    Boolean(linkedPlanDay.value) &&
    selectedWorkoutDate.value === linkedPlanDay.value.date &&
    selectedWorkoutDate.value <= today.value,
)
const displayedPlanDay = computed(() =>
  isPlanWorkout.value ? linkedPlanDay.value : isSelectedToday.value ? todayPlan.value : null,
)
const API_URL = 'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com'
const sortedWorkouts = computed(() =>
  [...workouts.value].sort((a, b) =>
    String(b.date ?? '').localeCompare(String(a.date ?? '')),
  ),
)

const filteredWorkouts = computed(() => {
  const search = historySearch.value.trim().toLowerCase()

  return sortedWorkouts.value.filter((workout) => {
    const matchesSearch =
      !search ||
      (workout.exercises ?? []).some((item) =>
        `${item.exercise ?? ''} ${item.muscleGroup ?? ''}`.toLowerCase().includes(search),
      )
    const matchesStart = !historyDateFrom.value || workout.date >= historyDateFrom.value
    const matchesEnd = !historyDateTo.value || workout.date <= historyDateTo.value

    return matchesSearch && matchesStart && matchesEnd
  })
})

const hasHistoryFilters = computed(() =>
  Boolean(historySearch.value || historyDateFrom.value || historyDateTo.value),
)

const clearHistoryFilters = () => {
  historySearch.value = ''
  historyDateFrom.value = ''
  historyDateTo.value = ''
}

const recentExercisePresets = computed(() => {
  const seen = new Set()

  return sortedWorkouts.value
    .flatMap((workout) => workout.exercises ?? [])
    .map((item) => ({
      name: String(item.exercise || '').trim(),
      group: String(item.muscleGroup || '').trim().toLowerCase(),
    }))
    .filter((item) => {
      const key = item.name.toLowerCase()

      if (!item.name || !item.group || seen.has(key)) return false
      seen.add(key)
      return true
    })
})

const suggestedExercises = computed(() => {
  if (muscleGroup.value) {
    return EXERCISE_LIBRARY.filter((item) => item.group === muscleGroup.value).slice(0, 5)
  }

  return recentExercisePresets.value.length
    ? recentExercisePresets.value.slice(0, 5)
    : EXERCISE_LIBRARY.slice(0, 5)
})

const chooseExercise = (preset) => {
  muscleGroup.value = preset.group
  exercise.value = preset.name
  formError.value = ''
}

const applyWorkoutTemplate = (template) => {
  const existingExercises = new Set(
    exercises.value.map((item) => String(item.exercise || '').trim().toLowerCase()),
  )
  const additions = template.exercises
    .filter((item) => !existingExercises.has(item.exercise.toLowerCase()))
    .map((item) => ({ ...item }))

  formError.value = ''
  saveNotice.value = ''

  if (!additions.length) {
    templateNotice.value = `${template.title} is already included in this session.`
    return
  }

  exercises.value.push(...additions)
  templateNotice.value = `${additions.length} exercises added from ${template.title}. Adjust the weight for your level before saving.`
}

const repeatWorkout = (workout) => {
  const workoutExercises = Array.isArray(workout.exercises) ? workout.exercises : []

  if (!workoutExercises.length) {
    historyActionNotice.value = 'This workout does not contain any exercises to copy.'
    return
  }

  const existingExercises = new Set(
    exercises.value.map((item) => String(item.exercise || '').trim().toLowerCase()),
  )
  const additions = workoutExercises
    .filter((item) => {
      const name = String(item.exercise || '').trim().toLowerCase()

      if (!name || existingExercises.has(name)) return false
      existingExercises.add(name)
      return true
    })
    .map((item) => ({ ...item }))

  formError.value = ''
  saveNotice.value = ''
  templateNotice.value = ''

  if (!additions.length) {
    historyActionNotice.value = 'Every exercise from this workout is already in the current session.'
    return
  }

  exercises.value.push(...additions)
  historyActionNotice.value = `${additions.length} exercise${additions.length === 1 ? '' : 's'} copied to the current session. Review the details before saving.`
  requestAnimationFrame(() => {
    document.getElementById('current-session')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const addExercise = () => {
  formError.value = ''

  if (
    !muscleGroup.value ||
    !exercise.value ||
    !sets.value ||
    !reps.value ||
    weight.value === ''
  ) {
    formError.value = 'Please complete all fields.'
    return
  }

  exercises.value.push({
    muscleGroup: muscleGroup.value,
    exercise: exercise.value,
    sets: sets.value,
    reps: reps.value,
    weight: weight.value,
  })

  muscleGroup.value = ''
  exercise.value = ''
  sets.value = ''
  reps.value = ''
  weight.value = ''
}

const removeExercise = (index) => {
  exercises.value.splice(index, 1)
}

const clearCurrentSession = () => {
  if (!exercises.value.length) return

  const confirmed = window.confirm(
    'Clear every exercise from the current session? Saved workout history will not be affected.',
  )

  if (!confirmed) return

  exercises.value = []
  muscleGroup.value = ''
  exercise.value = ''
  sets.value = ''
  reps.value = ''
  weight.value = ''
  formError.value = ''
  saveNotice.value = ''
  templateNotice.value = ''
  historyActionNotice.value = ''
  workoutDraftNotice.value = ''
  clearActivityDraft(workoutDraftKey.value)
}

const saveWorkout = async () => {
  formError.value = ''
  saveNotice.value = ''

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedWorkoutDate.value) || selectedWorkoutDate.value > today.value) {
    formError.value = 'Please choose today or an earlier date.'
    return
  }

  if (exercises.value.length === 0) {
    formError.value = 'Please add at least one exercise.'
    return
  }

  const hasInvalidMetrics = exercises.value.some((item) => {
    const itemSets = Number(item.sets)
    const itemReps = Number(item.reps)
    const itemWeight = Number(item.weight)

    return (
      !Number.isFinite(itemSets) ||
      itemSets < 1 ||
      !Number.isFinite(itemReps) ||
      itemReps < 1 ||
      !Number.isFinite(itemWeight) ||
      itemWeight < 0
    )
  })

  if (hasInvalidMetrics) {
    formError.value = 'Each exercise needs at least 1 set and 1 rep, with a valid weight.'
    return
  }

  isSaving.value = true

  try {
    const workout = {
      date: selectedWorkoutDate.value,
      exercises: exercises.value,
    }

    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    const response = await fetch(
      `${API_URL}/workouts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(workout),
      },
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Your workout could not be saved.')
    }

    exercises.value = []
    templateNotice.value = ''
    clearActivityDraft(workoutDraftKey.value)
    workoutDraftNotice.value = ''
    await loadWorkouts()

    if (isPlanWorkout.value && !linkedPlanDay.value.completed) {
      try {
        weeklyPlan.value = await updateWeeklyPlanDay(
          weeklyPlan.value,
          linkedPlanDay.value.dayNumber,
          true,
        )
        todayPlan.value = getTodayPlanDay(weeklyPlan.value)
        saveNotice.value = `Workout saved and Day ${linkedPlanDay.value.dayNumber} marked complete.`
      } catch {
        saveNotice.value = 'Workout saved, but the linked plan day could not be marked complete. You can update it from My Plan.'
      }
    } else {
      saveNotice.value = 'Workout saved successfully.'
    }
  } catch (error) {
    formError.value = error.message || 'Your workout could not be saved.'
  } finally {
    isSaving.value = false
  }
}

const loadWorkouts = async () => {
  isLoadingHistory.value = true
  historyError.value = ''

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) throw new Error('Your session has expired. Please sign in again.')

    const response = await fetch(`${API_URL}/workouts`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Your workout history could not be loaded.')
    }

    workouts.value = Array.isArray(data) ? data : (data.workouts ?? [])
  } catch (error) {
    historyError.value = error.message || 'Your workout history could not be loaded.'
  } finally {
    isLoadingHistory.value = false
  }
}

const deleteWorkout = async (workoutId) => {
  if (!workoutId || deletingWorkoutId.value) return

  historyError.value = ''
  saveNotice.value = ''
  deletingWorkoutId.value = workoutId

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) throw new Error('Your session has expired. Please sign in again.')

    const response = await fetch(
      `${API_URL}/workouts?workoutId=${encodeURIComponent(workoutId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      },
    )
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'The workout could not be deleted.')
    }

    workouts.value = workouts.value.filter((workout) => workout.workoutId !== workoutId)
    workoutPendingDelete.value = ''
    saveNotice.value = 'Workout deleted successfully.'
  } catch (error) {
    historyError.value = error.message || 'The workout could not be deleted.'
  } finally {
    deletingWorkoutId.value = ''
  }
}

const startEditingWorkout = (workout) => {
  editingWorkoutId.value = workout.workoutId
  editWorkoutDraft.value = {
    date: workout.date,
    exercises: (workout.exercises ?? []).map((item) => ({ ...item })),
  }
  workoutPendingDelete.value = ''
  historyError.value = ''
}

const cancelEditingWorkout = () => {
  editingWorkoutId.value = ''
  editWorkoutDraft.value = null
}

const addEditExercise = () => {
  editWorkoutDraft.value.exercises.push({
    muscleGroup: '',
    exercise: '',
    sets: 3,
    reps: 10,
    weight: 0,
  })
}

const updateWorkout = async () => {
  if (!editingWorkoutId.value || isUpdatingWorkout.value) return

  historyError.value = ''
  saveNotice.value = ''

  if (!editWorkoutDraft.value.date || editWorkoutDraft.value.exercises.length === 0) {
    historyError.value = 'A workout needs a date and at least one exercise.'
    return
  }

  isUpdatingWorkout.value = true

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) throw new Error('Your session has expired. Please sign in again.')

    const response = await fetch(`${API_URL}/workouts`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workoutId: editingWorkoutId.value,
        ...editWorkoutDraft.value,
      }),
    })
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'The workout could not be updated.')
    }

    workouts.value = workouts.value.map((workout) =>
      workout.workoutId === editingWorkoutId.value ? result : workout,
    )
    cancelEditingWorkout()
    saveNotice.value = 'Workout updated successfully.'
  } catch (error) {
    historyError.value = error.message || 'The workout could not be updated.'
  } finally {
    isUpdatingWorkout.value = false
  }
}

const initializeWorkoutDraft = async () => {
  try {
    const key = await getActivityDraftKey('workout')
    const draft = loadActivityDraft(key)

    workoutDraftKey.value = key

    if (exercises.value.length) {
      saveActivityDraft(key, { date: selectedWorkoutDate.value, exercises: exercises.value })
      return
    }

    if (
      typeof draft?.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(draft.date) &&
      draft.date <= today.value
    ) {
      selectedWorkoutDate.value = draft.date
    }

    if (Array.isArray(draft?.exercises) && draft.exercises.length) {
      exercises.value = draft.exercises.map((item) => ({ ...item }))
      workoutDraftNotice.value = 'Your unsaved workout draft was restored on this device.'
    }
  } catch {
    workoutDraftKey.value = ''
  }
}

watch(
  [exercises, selectedWorkoutDate],
  ([currentExercises, currentDate]) => {
    if (!workoutDraftKey.value) return

    if (currentExercises.length) {
      const saved = saveActivityDraft(workoutDraftKey.value, {
        date: currentDate,
        exercises: currentExercises,
      })

      if (saved && !workoutDraftNotice.value) {
        workoutDraftNotice.value = 'This workout draft and its date are saved automatically on this device.'
      }
    } else {
      clearActivityDraft(workoutDraftKey.value)
      workoutDraftNotice.value = ''
    }
  },
  { deep: true },
)

onMounted(() => {
  initializeWorkoutDraft()
  loadWorkouts()
  loadWeeklyPlan().then((plan) => {
    weeklyPlan.value = plan
    todayPlan.value = getTodayPlanDay(plan)

    if (route.query.fromPlan === '1') {
      const requestedDay = Number(route.query.day)
      const requestedPlanDay = plan?.days?.find((day) => day.dayNumber === requestedDay)

      if (requestedPlanDay?.date && requestedPlanDay.date <= today.value) {
        selectedWorkoutDate.value = requestedPlanDay.date
      }
    }
  })
})

</script>

<template>
  <main class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div>
        <div class="brand">
          <BrandMark />
          <span>RepVelta</span>
        </div>

        <AppNavigation />
      </div>

      <div class="sidebar-card">
        <div class="sidebar-card-icon"><AppIcon name="coach" :size="25" /></div>

        <h3>
          Train.<br />
          Track.<br />
          Improve.
        </h3>

        <p>
          Build better habits and keep your progress in one place.
        </p>
      </div>
    </aside>

    <!-- Main Content -->
    <section class="main-content">
      <header class="topbar">
        <div>
          <h1>{{ isSelectedToday ? "Today's Workout" : `Workout for ${selectedDateLabel}` }}</h1>
          <p>{{ isSelectedToday ? 'Build your session and track your training progress.' : 'Add a training session you completed on a previous date.' }}</p>
        </div>

        <div class="topbar-tools">
          <label class="log-date-control">
            <span>Log date</span>
            <input v-model="selectedWorkoutDate" type="date" :max="today" />
          </label>
          <UserProfileBadge />
        </div>
      </header>

      <section v-if="displayedPlanDay" class="coach-plan-banner" :class="{ active: isPlanWorkout }">
        <div class="coach-plan-mark"><AppIcon name="coach" :size="25" /></div>
        <div>
          <p>{{ isPlanWorkout ? 'PLAN WORKOUT ACTIVE' : 'REPVELTA COACH' }} · DAY {{ displayedPlanDay.dayNumber }}</p>
          <h2>{{ isPlanWorkout ? `Complete the planned session for ${selectedDateLabel}` : 'Today’s saved plan' }}</h2>
          <div>{{ displayedPlanDay.details }}</div>
          <small v-if="isPlanWorkout">Saving this workout will automatically mark this plan day complete.</small>
        </div>
        <RouterLink to="/plan">View full plan →</RouterLink>
      </section>

      <!-- Summary Cards -->
      <section class="summary-grid">
        <article class="summary-card blue-card">
          <p>Current Session</p>
          <div class="summary-value">
            {{ exercises.length }}
          </div>
          <span>Exercises added</span>
        </article>

        <article class="summary-card yellow-card">
          <p>Saved Workouts</p>
          <div class="summary-value">
            {{ workouts.length }}
          </div>
          <span>Total sessions</span>
        </article>

        <article class="summary-card lime-card">
          <p>{{ isSelectedToday ? "Today's Focus" : 'Session Date' }}</p>
          <div class="summary-text">
            {{ displayedPlanDay ? `Plan Day ${displayedPlanDay.dayNumber}` : isSelectedToday ? 'Keep moving' : selectedDateLabel }}
          </div>
          <span>{{ isPlanWorkout ? 'Plan-linked session' : isSelectedToday ? 'One session at a time' : 'Historical workout entry' }}</span>
        </article>
      </section>

      <section class="template-section" aria-labelledby="workout-templates-heading">
        <div class="template-heading">
          <div>
            <p>QUICK START</p>
            <h2 id="workout-templates-heading">Choose a workout template</h2>
            <span>Add a ready-made session, then adjust sets, reps, and weight as needed.</span>
          </div>
          <div class="template-heading-icon"><AppIcon name="workout" :size="24" /></div>
        </div>

        <div class="template-grid">
          <article v-for="template in WORKOUT_TEMPLATES" :key="template.id" class="template-card">
            <div>
              <h3>{{ template.title }}</h3>
              <p>{{ template.description }}</p>
            </div>
            <ul>
              <li v-for="item in template.exercises" :key="item.exercise">
                <span>{{ item.exercise }}</span>
                <small>{{ item.sets }} × {{ item.reps }}</small>
              </li>
            </ul>
            <button type="button" @click="applyWorkoutTemplate(template)">Add to session</button>
          </article>
        </div>

        <p v-if="templateNotice" class="template-notice" aria-live="polite">
          {{ templateNotice }}
        </p>
      </section>

      <!-- Add Exercise -->
      <section class="content-card add-card">
        <div class="card-heading">
          <div>
            <h2>Add Exercise</h2>
            <p>Add an exercise to the selected training session.</p>
          </div>

          <div class="heading-icon">+</div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="muscleGroup">Muscle Group</label>

            <select
              id="muscleGroup"
              v-model="muscleGroup"
            >
              <option value="">
                Select a muscle group
              </option>

              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="legs">Legs</option>
              <option value="shoulders">Shoulders</option>
              <option value="arms">Arms</option>
              <option value="core">Core</option>
            </select>
          </div>

          <div class="form-group">
            <label for="exercise">Exercise</label>

            <input
              id="exercise"
              v-model="exercise"
              list="exerciseSuggestions"
              type="text"
              placeholder="e.g. Bench Press"
            />
            <datalist id="exerciseSuggestions">
              <option v-for="item in EXERCISE_LIBRARY" :key="item.name" :value="item.name" />
            </datalist>
          </div>
        </div>

        <div class="exercise-suggestions">
          <div class="suggestion-heading">
            <strong>{{ muscleGroup ? `${muscleGroup} exercises` : workouts.length ? 'Recently trained' : 'Popular exercises' }}</strong>
            <span>Choose one or enter your own</span>
          </div>
          <div class="suggestion-list">
            <button
              v-for="preset in suggestedExercises"
              :key="`${preset.group}-${preset.name}`"
              type="button"
              :class="{ selected: exercise === preset.name }"
              @click="chooseExercise(preset)"
            >
              <span>{{ preset.name }}</span>
              <small>{{ preset.group }}</small>
            </button>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="form-group">
            <label for="sets">Sets</label>

            <input
              id="sets"
              v-model.number="sets"
              type="number"
              min="1"
              placeholder="3"
            />
          </div>

          <div class="form-group">
            <label for="reps">Reps</label>

            <input
              id="reps"
              v-model.number="reps"
              type="number"
              min="1"
              placeholder="10"
            />
          </div>

          <div class="form-group">
            <label for="weight">Weight (kg)</label>

            <input
              id="weight"
              v-model.number="weight"
              type="number"
              min="0"
              placeholder="60"
            />
          </div>
        </div>

        <p
          v-if="formError"
          class="error-message"
        >
          {{ formError }}
        </p>

        <p v-if="saveNotice" class="success-message">{{ saveNotice }}</p>

        <div class="form-actions">
          <button
            type="button"
            class="add-button"
            @click="addExercise"
          >
            + Add Exercise
          </button>
        </div>
      </section>

      <!-- Session and History -->
      <section class="dashboard-grid">
        <!-- Current Session -->
        <article id="current-session" class="content-card session-card">
          <div class="card-heading">
            <div>
              <h2>Current Session</h2>
              <p>
                {{ exercises.length }} exercise(s) added
              </p>
            </div>

            <div class="session-heading-actions">
              <span class="session-badge">
                {{ isSelectedToday ? 'Today' : selectedDateLabel }}
              </span>
              <button
                v-if="exercises.length"
                type="button"
                class="clear-session-button"
                @click="clearCurrentSession"
              >
                Clear session
              </button>
            </div>
          </div>

          <p v-if="historyActionNotice" class="history-action-notice" aria-live="polite">
            {{ historyActionNotice }}
          </p>

          <p v-if="workoutDraftNotice" class="draft-notice" aria-live="polite">
            {{ workoutDraftNotice }}
          </p>

          <div
            v-if="exercises.length === 0"
            class="empty-state"
          >
            <div class="empty-icon"><AppIcon name="workout" :size="23" /></div>

            <p>No exercises added yet.</p>
          </div>

          <div
            v-for="(item, index) in exercises"
            :key="index"
            class="exercise-row"
          >
            <div>
              <div class="exercise-title">
                <h3>{{ item.exercise }}</h3>

                <span class="muscle-badge">
                  {{ item.muscleGroup }}
                </span>
              </div>

              <div class="session-metrics">
                <label>
                  <span>Sets</span>
                  <input
                    v-model.number="item.sets"
                    type="number"
                    min="1"
                    :aria-label="`${item.exercise} sets`"
                  />
                </label>
                <label>
                  <span>Reps</span>
                  <input
                    v-model.number="item.reps"
                    type="number"
                    min="1"
                    :aria-label="`${item.exercise} reps`"
                  />
                </label>
                <label>
                  <span>Weight</span>
                  <span class="metric-input">
                    <input
                      v-model.number="item.weight"
                      type="number"
                      min="0"
                      step="0.5"
                      :aria-label="`${item.exercise} weight in kilograms`"
                    />
                    <small>kg</small>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="button"
              class="remove-button"
              @click="removeExercise(index)"
            >
              Remove
            </button>
          </div>

          <button
            type="button"
            class="save-button"
            :disabled="exercises.length === 0 || isSaving"
            @click="saveWorkout"
          >
            {{ isSaving ? 'Saving…' : isPlanWorkout ? 'Save & Complete Plan Day' : 'Save Workout' }}
          </button>
        </article>

        <!-- History -->
        <article class="content-card history-panel">
          <div class="card-heading">
            <div>
              <h2>Workout History</h2>
              <p>Your previous training sessions.</p>
            </div>

            <span class="history-count">
              {{ filteredWorkouts.length }}{{ hasHistoryFilters ? ` of ${workouts.length}` : '' }}
            </span>
          </div>

          <div v-if="workouts.length" class="history-filters" aria-label="Filter workout history">
            <label class="history-search">
              <span>Search</span>
              <input v-model="historySearch" type="search" placeholder="Exercise or muscle group" />
            </label>
            <label>
              <span>From</span>
              <input v-model="historyDateFrom" type="date" />
            </label>
            <label>
              <span>To</span>
              <input v-model="historyDateTo" type="date" />
            </label>
            <button v-if="hasHistoryFilters" type="button" @click="clearHistoryFilters">Clear</button>
          </div>

          <div
            v-if="isLoadingHistory"
            class="empty-state"
            aria-live="polite"
          >
            <div class="history-spinner"></div>
            <p>Loading workout history...</p>
          </div>

          <div
            v-else-if="historyError"
            class="history-error"
            role="alert"
          >
            <p>{{ historyError }}</p>
            <button type="button" @click="loadWorkouts">Try again</button>
          </div>

          <div
            v-else-if="workouts.length === 0"
            class="empty-state"
          >
            <p>No workouts found.</p>
          </div>

          <div v-else-if="filteredWorkouts.length === 0" class="empty-state">
            <p>No workouts match these filters.</p>
            <button type="button" class="clear-filter-button" @click="clearHistoryFilters">Clear filters</button>
          </div>

          <div
            v-for="workout in filteredWorkouts"
            :key="workout.workoutId"
            class="history-item"
          >
            <div class="history-item-heading">
              <div class="history-date">
                {{ workout.date }}
              </div>
              <div v-if="editingWorkoutId !== workout.workoutId" class="history-actions">
                <button type="button" class="repeat-workout-button" @click="repeatWorkout(workout)">Use again</button>
                <button type="button" class="edit-workout-button" @click="startEditingWorkout(workout)">Edit</button>
                <button
                  v-if="workoutPendingDelete !== workout.workoutId"
                  type="button"
                  class="delete-workout-button"
                  @click="workoutPendingDelete = workout.workoutId"
                >
                  Delete
                </button>
              </div>
            </div>

            <div v-if="editingWorkoutId === workout.workoutId" class="edit-workout-form">
              <label>
                <span>Workout date</span>
                <input v-model="editWorkoutDraft.date" type="date" />
              </label>
              <div v-for="(item, index) in editWorkoutDraft.exercises" :key="index" class="edit-exercise-grid">
                <select v-model="item.muscleGroup" aria-label="Muscle group">
                  <option value="" disabled>Muscle group</option>
                  <option value="chest">Chest</option><option value="back">Back</option>
                  <option value="legs">Legs</option><option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option><option value="core">Core</option>
                </select>
                <input v-model="item.exercise" type="text" aria-label="Exercise name" placeholder="Exercise" />
                <input v-model.number="item.sets" type="number" min="1" aria-label="Sets" placeholder="Sets" />
                <input v-model.number="item.reps" type="number" min="1" aria-label="Reps" placeholder="Reps" />
                <input v-model.number="item.weight" type="number" min="0" step="0.5" aria-label="Weight" placeholder="kg" />
                <button type="button" class="remove-edit-exercise" @click="editWorkoutDraft.exercises.splice(index, 1)">Remove</button>
              </div>
              <button type="button" class="add-edit-exercise" @click="addEditExercise">+ Add exercise</button>
              <div class="edit-form-actions">
                <button type="button" :disabled="isUpdatingWorkout" @click="cancelEditingWorkout">Cancel</button>
                <button type="button" class="save-edit-button" :disabled="isUpdatingWorkout" @click="updateWorkout">
                  {{ isUpdatingWorkout ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </div>

            <template v-else>
              <div
                v-for="(item, index) in workout.exercises"
                :key="index"
                class="history-exercise"
              >
                <div>
                  <h3>{{ item.exercise }}</h3>
                  <p>{{ item.sets }} sets × {{ item.reps }} reps · {{ item.weight }} kg</p>
                </div>
                <span class="muscle-badge">{{ item.muscleGroup }}</span>
              </div>
            </template>

            <div
              v-if="workoutPendingDelete === workout.workoutId"
              class="delete-confirmation"
              role="alert"
            >
              <p><strong>Delete this workout?</strong><span>This cannot be undone.</span></p>
              <button type="button" :disabled="Boolean(deletingWorkoutId)" @click="workoutPendingDelete = ''">Cancel</button>
              <button
                type="button"
                class="confirm-delete-button"
                :disabled="Boolean(deletingWorkoutId)"
                @click="deleteWorkout(workout.workoutId)"
              >
                {{ deletingWorkoutId === workout.workoutId ? 'Deleting…' : 'Yes, delete' }}
              </button>
            </div>
          </div>
        </article>
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
  transition:
    background 0.2s ease,
    color 0.2s ease;
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

.topbar h1 {
  margin: 0;
  font-size: 2.6rem;
}

.topbar > div > p {
  margin: 7px 0 0;
  color: #7a8391;
  font-size: 1.1rem;
}

.topbar-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-date-control {
  min-width: 175px;
  padding: 8px 12px;
  display: grid;
  gap: 3px;
  border: 1px solid #d9e1dc;
  border-radius: 13px;
  background: #fffefd;
}

.log-date-control span {
  color: #68766f;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.log-date-control input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #17352c;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 750;
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

.coach-plan-banner { margin-bottom: 24px; padding: 22px 24px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 17px; border: 1px solid #cdddb2; border-radius: 18px; background: linear-gradient(135deg, #eef6dc 0%, #e4f0e9 100%); }
.coach-plan-banner.active { border-color: #86a842; box-shadow: 0 0 0 4px rgba(203, 237, 99, .2); }
.coach-plan-mark { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; background: #cbed63; color: #17352c; font-size: 1.25rem; font-weight: 900; }
.coach-plan-banner p { margin: 0 0 5px; color: #527064; font-size: .82rem; font-weight: 850; letter-spacing: .08em; }
.coach-plan-banner h2 { margin: 0 0 7px; font-size: 1.35rem; }
.coach-plan-banner div > div { color: #52615d; font-size: 1rem; line-height: 1.55; }
.coach-plan-banner small { display: block; margin-top: 8px; color: #315e51; font-size: .92rem; font-weight: 750; }
.coach-plan-banner a { padding: 11px 14px; border: 1px solid #bfd0c5; border-radius: 11px; background: #fffefd; color: #315e51; font-size: .95rem; font-weight: 800; text-decoration: none; white-space: nowrap; }

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

.summary-card p {
  margin: 0 0 12px;
  font-size: 1.02rem;
  font-weight: 600;
}

.summary-card span {
  display: block;
  margin-top: 9px;
  color: #66717f;
  font-size: 0.95rem;
}

.summary-value {
  font-size: 3rem;
  font-weight: 800;
}

.summary-text {
  font-size: 1.75rem;
  font-weight: 800;
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

/* Workout templates */

.template-section {
  margin-bottom: 24px;
  padding: 26px;
  border: 1px solid #dfe7e1;
  border-radius: 20px;
  background: linear-gradient(135deg, #f9fbf7 0%, #f2f7ee 100%);
}

.template-heading {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.template-heading p {
  margin: 0 0 6px;
  color: #5a766b;
  font-size: .82rem;
  font-weight: 850;
  letter-spacing: .1em;
}

.template-heading h2 {
  margin: 0 0 7px;
  font-size: 1.45rem;
}

.template-heading span {
  color: #68766f;
  font-size: 1rem;
  line-height: 1.5;
}

.template-heading-icon {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #e2f58b;
  color: #17352c;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.template-card {
  min-width: 0;
  padding: 19px;
  display: flex;
  flex-direction: column;
  border: 1px solid #dce5df;
  border-radius: 16px;
  background: #fffefd;
}

.template-card h3 {
  margin: 0 0 6px;
  font-size: 1.08rem;
}

.template-card p {
  margin: 0;
  color: #718079;
  font-size: .92rem;
  line-height: 1.5;
}

.template-card ul {
  margin: 16px 0 18px;
  padding: 0;
  display: grid;
  gap: 8px;
  list-style: none;
}

.template-card li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #365249;
  font-size: .9rem;
}

.template-card small {
  flex: 0 0 auto;
  color: #718079;
  font-size: .8rem;
  font-weight: 750;
}

.template-card button {
  width: 100%;
  min-height: 44px;
  margin-top: auto;
  border: 1px solid #bad552;
  border-radius: 11px;
  background: #e2f58b;
  color: #17352c;
  font: inherit;
  font-size: .94rem;
  font-weight: 800;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
}

.template-card button:hover {
  background: #d5ee70;
  transform: translateY(-1px);
}

.template-card button:focus-visible {
  outline: 3px solid rgba(126, 162, 58, .3);
  outline-offset: 2px;
}

.template-notice {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 11px;
  background: #e6f0eb;
  color: #315e51;
  font-size: .94rem;
  font-weight: 700;
}

/* Main cards */

.content-card {
  background: #fffefd;
  border: 1px solid #e7e9ec;
  border-radius: 20px;
  padding: 28px;
}

.add-card {
  margin-bottom: 20px;
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.card-heading h2 {
  margin: 0;
  font-size: 1.4rem;
}

.card-heading p {
  margin: 6px 0 0;
  color: #7d8693;
  font-size: 1rem;
}

.heading-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e2f58b;
  display: grid;
  place-items: center;
  font-weight: 900;
}

/* Form */

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 1rem;
  font-weight: 700;
}

.form-group input,
.form-group select {
  width: 100%;
  min-height: 52px;
  padding: 13px 15px;
  border: 1px solid #dfe3e8;
  border-radius: 12px;
  background: #fbfbfc;
  color: #172033;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #a9cbe0;
  box-shadow: 0 0 0 3px rgba(173, 211, 235, 0.22);
}

.exercise-suggestions {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e4eae6;
  border-radius: 14px;
  background: #f7faf8;
}

.suggestion-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.suggestion-heading strong {
  font-size: 0.95rem;
  text-transform: capitalize;
}

.suggestion-heading span {
  color: #718079;
  font-size: 0.84rem;
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.suggestion-list button {
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d8e1dc;
  border-radius: 999px;
  background: #fffefd;
  color: #28483e;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 750;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.suggestion-list button:hover,
.suggestion-list button.selected {
  border-color: #9ebc49;
  background: #e9f6b9;
  transform: translateY(-1px);
}

.suggestion-list small {
  color: #718079;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: capitalize;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.add-button {
  border: none;
  padding: 13px 20px;
  border-radius: 12px;
  background: #cbed63;
  color: #17352c;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.add-button:hover {
  background: #bfe45a;
  transform: translateY(-1px);
}

.error-message {
  margin-top: 16px;
  padding: 11px 13px;
  border-radius: 10px;
  background: #fff1f0;
  color: #b42318;
  font-size: 1rem;
}

.success-message {
  margin-top: 16px;
  padding: 11px 13px;
  border-radius: 10px;
  background: #edf7d0;
  color: #315e51;
  font-size: 1rem;
  font-weight: 700;
}

/* Bottom dashboard */

.dashboard-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 22px;
  align-items: start;
}

.session-badge {
  padding: 6px 11px;
  border-radius: 999px;
  background: #fff1a8;
  font-size: 0.92rem;
  font-weight: 700;
}

.session-heading-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-session-button {
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid #e3c2bd;
  border-radius: 9px;
  background: #fff;
  color: #a43a30;
  font: inherit;
  font-size: .84rem;
  font-weight: 750;
  cursor: pointer;
}

.clear-session-button:hover {
  background: #fff2ef;
}

.history-count {
  min-width: 31px;
  height: 31px;
  padding: 0 9px;
  border-radius: 999px;
  background: #e2f58b;
  display: grid;
  place-items: center;
  font-size: 0.92rem;
  font-weight: 800;
}

.history-filters {
  margin: 18px 0 8px;
  padding: 16px;
  border: 1px solid #dfe8e2;
  border-radius: 14px;
  background: #f7faf8;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) repeat(2, minmax(145px, .55fr)) auto;
  gap: 12px;
  align-items: end;
}

.history-filters label { display: flex; flex-direction: column; gap: 7px; color: #52615d; font-size: .88rem; font-weight: 750; }
.history-filters input { width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #ccd8d1; border-radius: 10px; background: #fff; color: #172033; font: inherit; }
.history-filters input:focus { outline: 3px solid rgba(203, 237, 99, .32); border-color: #7da23a; }
.history-filters button, .clear-filter-button { min-height: 44px; padding: 10px 15px; border: 1px solid #ccd8d1; border-radius: 10px; background: #fff; color: #315e51; font: inherit; font-weight: 750; cursor: pointer; }
.history-filters button:hover, .clear-filter-button:hover { background: #eaf4c7; }
.history-action-notice { margin: 0 0 14px; padding: 11px 13px; border-radius: 10px; background: #edf7d0; color: #315e51; font-size: .9rem; font-weight: 700; line-height: 1.45; }
.draft-notice { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #dce6df; border-radius: 10px; background: #f5f8f6; color: #5d6f68; font-size: .88rem; line-height: 1.45; }

/* Exercises */

.exercise-row,
.history-exercise {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.exercise-row {
  padding: 14px 0;
  border-bottom: 1px solid #edf0f2;
}

.exercise-row > div:first-child {
  min-width: 0;
  flex: 1;
}

.exercise-title {
  display: flex;
  align-items: center;
  gap: 9px;
}

.exercise-title h3,
.history-exercise h3 {
  margin: 0;
  font-size: 1.08rem;
}

.exercise-row p,
.history-exercise p {
  margin: 5px 0 0;
  color: #7d8693;
  font-size: 0.98rem;
}

.session-metrics {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.session-metrics label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #66746e;
  font-size: .8rem;
  font-weight: 750;
}

.session-metrics input {
  width: 58px;
  min-height: 38px;
  padding: 7px 8px;
  border: 1px solid #d6dfd9;
  border-radius: 9px;
  background: #fff;
  color: #172033;
  font: inherit;
  font-size: .9rem;
}

.session-metrics input:focus {
  outline: 3px solid rgba(203, 237, 99, .32);
  border-color: #7da23a;
}

.metric-input {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d6dfd9;
  border-radius: 9px;
  background: #fff;
}

.metric-input:focus-within {
  outline: 3px solid rgba(203, 237, 99, .32);
  border-color: #7da23a;
}

.metric-input input {
  border: 0;
  border-radius: 9px 0 0 9px;
}

.metric-input input:focus {
  outline: none;
}

.metric-input small {
  padding-right: 8px;
  color: #7d8984;
  font-size: .75rem;
}

.muscle-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #dcefea;
  color: #315e51;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: capitalize;
}

.remove-button {
  border: none;
  background: transparent;
  color: #c03a2b;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
}

.save-button {
  width: 100%;
  margin-top: 20px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #cbed63;
  color: #17352c;
  font-size: 1.02rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.save-button:hover:not(:disabled) {
  background: #d7ef75;
  transform: translateY(-1px);
}

.save-button:disabled {
  background: #eceff2;
  color: #adb4bd;
  cursor: not-allowed;
  transform: none;
}

/* History */

.history-panel {
  min-height: 300px;
}

.history-item {
  padding: 14px 0;
  border-top: 1px solid #edf0f2;
}

.history-date {
  font-size: 0.92rem;
  color: #8d95a1;
  font-weight: 700;
}

.history-item-heading { min-height: 34px; margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.history-actions { display: flex; align-items: center; gap: 7px; }
.repeat-workout-button { padding: 7px 10px; border: 1px solid #bad552; border-radius: 9px; background: #eef8c9; color: #315e51; font: inherit; font-size: .88rem; font-weight: 750; cursor: pointer; }
.repeat-workout-button:hover { background: #e2f58b; }
.edit-workout-button { padding: 7px 10px; border: 1px solid #bfd0c5; border-radius: 9px; background: #fff; color: #315e51; font: inherit; font-size: .88rem; font-weight: 750; cursor: pointer; }
.delete-workout-button { padding: 7px 10px; border: 1px solid #e3c2bd; border-radius: 9px; background: #fff; color: #a43a30; font: inherit; font-size: .88rem; font-weight: 750; cursor: pointer; }
.delete-workout-button:hover { background: #fff2ef; }
.delete-confirmation { margin-top: 10px; padding: 13px; display: flex; align-items: center; gap: 8px; border-radius: 11px; background: #fff0ed; }
.delete-confirmation p { margin: 0 auto 0 0; display: flex; flex-direction: column; color: #7e322b; font-size: .92rem; }
.delete-confirmation p span { margin-top: 2px; color: #985f58; }
.delete-confirmation button { padding: 8px 11px; border: 1px solid #d8c2be; border-radius: 9px; background: white; color: #5b4c49; font: inherit; font-size: .88rem; font-weight: 750; cursor: pointer; }
.delete-confirmation .confirm-delete-button { border-color: #a33b31; background: #a33b31; color: white; }
.delete-confirmation button:disabled { opacity: .55; cursor: wait; }
.history-error { margin: 16px 0; padding: 14px; border-radius: 11px; background: #fff1f0; color: #8f2e25; }
.history-error p { margin: 0 0 10px; }
.history-error button { padding: 8px 12px; border: 0; border-radius: 8px; background: #8f2e25; color: white; font: inherit; font-weight: 750; cursor: pointer; }
.history-spinner { width: 30px; height: 30px; border: 4px solid #dfe8e2; border-top-color: #79a337; border-radius: 50%; animation: spin .8s linear infinite; }
.edit-workout-form { margin: 10px 0 5px; padding: 16px; border: 1px solid #cfddd4; border-radius: 14px; background: #f6faf7; }
.edit-workout-form label { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; color: #315e51; font-size: .9rem; font-weight: 750; }
.edit-workout-form input, .edit-workout-form select { min-width: 0; min-height: 42px; padding: 9px 10px; border: 1px solid #d6dfd9; border-radius: 9px; background: #fff; color: #172033; font: inherit; }
.edit-exercise-grid { display: grid; grid-template-columns: 1.1fr 1.6fr .65fr .65fr .75fr auto; gap: 7px; margin-top: 8px; }
.remove-edit-exercise { border: 0; background: transparent; color: #a43a30; font: inherit; font-size: .84rem; font-weight: 750; cursor: pointer; }
.add-edit-exercise { margin-top: 12px; padding: 8px 11px; border: 1px dashed #9fb5a7; border-radius: 9px; background: #fff; color: #315e51; font: inherit; font-size: .88rem; font-weight: 750; cursor: pointer; }
.edit-form-actions { margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px; }
.edit-form-actions button { padding: 9px 13px; border: 1px solid #cfd9d2; border-radius: 9px; background: #fff; color: #52615d; font: inherit; font-weight: 750; cursor: pointer; }
.edit-form-actions .save-edit-button { border-color: #cbed63; background: #cbed63; color: #17352c; }
.edit-form-actions button:disabled { opacity: .55; cursor: wait; }
@keyframes spin { to { transform: rotate(360deg); } }

.history-exercise {
  padding: 8px 0;
}

.empty-state {
  min-height: 120px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  text-align: center;
  color: #8b93a0;
}

.empty-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f1f3f5;
  display: grid;
  place-items: center;
}

/* Responsive */

@media (max-width: 1000px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }

  .history-filters { grid-template-columns: 1fr 1fr; }
  .history-search { grid-column: 1 / -1; }
}

@media (max-width: 650px) {
  .main-content {
    padding: 24px 16px 40px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar-tools,
  .log-date-control {
    width: 100%;
  }

  .profile {
    display: none;
  }

  .form-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .template-section {
    padding: 20px;
  }

  .template-heading-icon {
    display: none;
  }

  .suggestion-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .suggestion-list button {
    width: 100%;
    justify-content: space-between;
    border-radius: 11px;
  }

  .exercise-row {
    align-items: flex-start;
  }

  .session-metrics {
    align-items: flex-start;
    flex-direction: column;
  }

  .coach-plan-banner { grid-template-columns: auto 1fr; }
  .coach-plan-banner a { grid-column: 1 / -1; text-align: center; }
  .edit-exercise-grid { grid-template-columns: 1fr 1fr; }
  .edit-exercise-grid input[aria-label="Exercise name"] { grid-column: 1 / -1; }
  .history-filters { grid-template-columns: 1fr; }
  .history-search { grid-column: auto; }
}
</style>
