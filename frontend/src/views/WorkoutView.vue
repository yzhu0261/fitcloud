<script setup>
import { ref, computed, onMounted } from 'vue'
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

const route = useRoute()

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
const isSaving = ref(false)
const isLoadingHistory = ref(true)
const historyError = ref('')
const deletingWorkoutId = ref('')
const workoutPendingDelete = ref('')
const todayPlan = ref(null)
const isPlanWorkout = computed(() => route.query.fromPlan === '1' && Boolean(todayPlan.value))
const API_URL = 'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com'
const sortedWorkouts = computed(() =>
  [...workouts.value].sort((a, b) =>
    String(b.date ?? '').localeCompare(String(a.date ?? '')),
  ),
)

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

const saveWorkout = async () => {
  formError.value = ''
  saveNotice.value = ''

  if (exercises.value.length === 0) {
    formError.value = 'Please add at least one exercise.'
    return
  }

  isSaving.value = true

  try {
    const workout = {
      date: new Date().toISOString().split('T')[0],
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
    await loadWorkouts()

    if (isPlanWorkout.value && !todayPlan.value.completed) {
      try {
        weeklyPlan.value = await updateWeeklyPlanDay(
          weeklyPlan.value,
          todayPlan.value.dayNumber,
          true,
        )
        todayPlan.value = getTodayPlanDay(weeklyPlan.value)
        saveNotice.value = `Workout saved and Day ${todayPlan.value.dayNumber} marked complete.`
      } catch {
        saveNotice.value = 'Workout saved, but today’s plan could not be marked complete. You can update it from My Plan.'
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

onMounted(() => {
  loadWorkouts()
  loadWeeklyPlan().then((plan) => {
    weeklyPlan.value = plan
    todayPlan.value = getTodayPlanDay(plan)
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
          <h1>Today's Workout</h1>
          <p>Build your session and track your training progress.</p>
        </div>

        <UserProfileBadge />
      </header>

      <section v-if="todayPlan" class="coach-plan-banner" :class="{ active: isPlanWorkout }">
        <div class="coach-plan-mark"><AppIcon name="coach" :size="25" /></div>
        <div>
          <p>{{ isPlanWorkout ? 'PLAN WORKOUT ACTIVE' : 'REPVELTA COACH' }} · DAY {{ todayPlan.dayNumber }}</p>
          <h2>{{ isPlanWorkout ? 'Complete today’s planned session' : 'Today’s saved plan' }}</h2>
          <div>{{ todayPlan.details }}</div>
          <small v-if="isPlanWorkout">Saving this workout will automatically mark today’s plan complete.</small>
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
          <p>Today's Focus</p>
          <div class="summary-text">
            {{ todayPlan ? `Plan Day ${todayPlan.dayNumber}` : 'Keep moving' }}
          </div>
          <span>{{ isPlanWorkout ? 'Plan-linked session' : 'One session at a time' }}</span>
        </article>
      </section>

      <!-- Add Exercise -->
      <section class="content-card add-card">
        <div class="card-heading">
          <div>
            <h2>Add Exercise</h2>
            <p>Add an exercise to today's training session.</p>
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
              type="text"
              placeholder="e.g. Bench Press"
            />
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
        <article class="content-card session-card">
          <div class="card-heading">
            <div>
              <h2>Current Session</h2>
              <p>
                {{ exercises.length }} exercise(s) added
              </p>
            </div>

            <span class="session-badge">
              Today
            </span>
          </div>

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

              <p>
                {{ item.sets }} sets ×
                {{ item.reps }} reps ·
                {{ item.weight }} kg
              </p>
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
              {{ workouts.length }}
            </span>
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

          <div
            v-for="workout in sortedWorkouts"
            :key="workout.workoutId"
            class="history-item"
          >
            <div class="history-item-heading">
              <div class="history-date">
                {{ workout.date }}
              </div>
              <button
                v-if="workoutPendingDelete !== workout.workoutId"
                type="button"
                class="delete-workout-button"
                @click="workoutPendingDelete = workout.workoutId"
              >
                Delete
              </button>
            </div>

            <div
              v-for="(item, index) in workout.exercises"
              :key="index"
              class="history-exercise"
            >
              <div>
                <h3>{{ item.exercise }}</h3>

                <p>
                  {{ item.sets }} sets ×
                  {{ item.reps }} reps ·
                  {{ item.weight }} kg
                </p>
              </div>

              <span class="muscle-badge">
                {{ item.muscleGroup }}
              </span>
            </div>

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
}

@media (max-width: 650px) {
  .main-content {
    padding: 24px 16px 40px;
  }

  .topbar {
    align-items: flex-start;
  }

  .profile {
    display: none;
  }

  .form-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .coach-plan-banner { grid-template-columns: auto 1fr; }
  .coach-plan-banner a { grid-column: 1 / -1; text-align: center; }
}
</style>
