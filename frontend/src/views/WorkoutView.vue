<script setup>
import { ref } from 'vue'
import { fetchAuthSession } from 'aws-amplify/auth'

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

  workouts.value.push(workout)

  console.log('Saved workouts:', workouts.value)
}

</script>

<template>
  <main class="workout">
    <h1>Today's Workout</h1>
    <p>Record your workout for today.</p>

    <div class="form-group">
        <label for="muscleGroup">Muscle Group</label>

        <select id="muscleGroup" v-model="muscleGroup">
            <option value="">Select a muscle group</option>
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
        type="text"
        v-model="exercise"
        placeholder="e.g. Bench Press"
    />
    </div>

    <div class="form-group">
        <label for="sets">Sets</label>
        <input
            id="sets"
            type="number"
            v-model.number="sets"
            min="1"
        />
    </div>

    <div class="form-group">
        <label for="reps">Reps</label>
        <input
            id="reps"
            type="number"
            v-model.number="reps"
            min="1"
        />
    </div>

    <div class="form-group">
        <label for="weight">Weight (kg)</label>
        <input
            id="weight"
            type="number"
            v-model.number="weight"
            min="0"
        />
    </div>

    <button type="button" @click="addExercise">
        Add Exercise
    </button>

    <p v-if="formError" class="error">
        {{ formError }}
    </p>

    <p>Total exercises: {{ exercises.length }}</p>

    <div v-for="(item, index) in exercises" :key="index">
        <p>
            {{ item.exercise }} -
            {{ item.muscleGroup }} -
            {{ item.sets }} sets ×
            {{ item.reps }} reps -
            {{ item.weight }} kg
        </p>

        <button type="button" @click="removeExercise(index)">
            Remove
        </button>
    </div>

    <button
      type="button"
      @click="saveWorkout"
    >
      Save Workout
    </button>

  </main>
</template>

<style scoped>
.workout {
  max-width: 500px;
  margin: 40px auto;
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.error {
  color: red;
}
</style>