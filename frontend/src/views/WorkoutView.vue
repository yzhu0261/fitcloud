<script setup>
import { ref, onMounted } from 'vue'
import { fetchAuthSession } from 'aws-amplify/auth'
import { RouterLink } from 'vue-router'

const muscleGroup = ref('')
const exercise = ref('')
const sets = ref('')
const reps = ref('')
const weight = ref('')

const exercises = ref([])
const workouts = ref([])
const formError = ref('')

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

  if (exercises.value.length === 0) {
    formError.value = 'Please add at least one exercise.'
    return
  }

  const workout = {
    date: new Date().toISOString().split('T')[0],
    exercises: exercises.value,
  }

  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()

  const response = await fetch(
    'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com/workouts',
    {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(workout),
    }
  )

  const result = await response.json()

  console.log('API response:', result)

  await loadWorkouts()

  console.log('Saved workouts:', workouts.value)
}

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

  console.log('Loaded workouts:', workouts.value)
}

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
          <RouterLink to="/dashboard" class="nav-item">
            <span>▦</span>
            Dashboard
          </RouterLink>

          <RouterLink to="/workout" class="nav-item active">
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
    </aside>

    <!-- Main Content -->
    <section class="main-content">
      <header class="topbar">
        <div>
          <h1>Today's Workout</h1>
          <p>Build your session and track your training progress.</p>
        </div>

        <div class="profile">
          <div class="profile-avatar">A</div>

          <div>
            <strong>My Account</strong>
            <p>FitCloud Member</p>
          </div>
        </div>
      </header>

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
            Keep moving
          </div>
          <span>One session at a time</span>
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
            <div class="empty-icon">⌁</div>

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
            :disabled="exercises.length === 0"
            @click="saveWorkout"
          >
            Save Workout
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
            v-if="workouts.length === 0"
            class="empty-state"
          >
            <p>No workouts found.</p>
          </div>

          <div
            v-for="workout in workouts"
            :key="workout.workoutId"
            class="history-item"
          >
            <div class="history-date">
              {{ workout.date }}
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
  transition:
    background 0.2s ease,
    color 0.2s ease;
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
  margin-bottom: 28px;
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
  min-height: 145px;
  border-radius: 20px;
  padding: 22px;
}

.summary-card p {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.summary-card span {
  display: block;
  margin-top: 9px;
  color: #66717f;
  font-size: 0.78rem;
}

.summary-value {
  font-size: 2.4rem;
  font-weight: 800;
}

.summary-text {
  font-size: 1.45rem;
  font-weight: 800;
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

/* Main cards */

.content-card {
  background: #fffefd;
  border: 1px solid #e7e9ec;
  border-radius: 20px;
  padding: 22px;
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
  font-size: 1.12rem;
}

.card-heading p {
  margin: 6px 0 0;
  color: #7d8693;
  font-size: 0.83rem;
}

.heading-icon {
  width: 34px;
  height: 34px;
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
  font-size: 0.8rem;
  font-weight: 700;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #dfe3e8;
  border-radius: 12px;
  background: #fbfbfc;
  color: #172033;
  font-size: 0.9rem;
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
  padding: 11px 17px;
  border-radius: 12px;
  background: #d8ecf8;
  color: #172033;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.add-button:hover {
  background: #c9e4f5;
  transform: translateY(-1px);
}

.error-message {
  margin-top: 16px;
  padding: 11px 13px;
  border-radius: 10px;
  background: #fff1f0;
  color: #b42318;
  font-size: 0.82rem;
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
  font-size: 0.75rem;
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
  font-size: 0.78rem;
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
  font-size: 0.9rem;
}

.exercise-row p,
.history-exercise p {
  margin: 5px 0 0;
  color: #7d8693;
  font-size: 0.78rem;
}

.muscle-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #d8ecf8;
  color: #456678;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: capitalize;
}

.remove-button {
  border: none;
  background: transparent;
  color: #c03a2b;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.75rem;
}

.save-button {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: #e2f58b;
  color: #172033;
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
  margin-bottom: 10px;
  font-size: 0.72rem;
  color: #8d95a1;
  font-weight: 700;
}

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
}
</style>