<template>
  <div class="app-shell">
    <!-- Sidebar navigation. -->
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-logo">F</div>
          <span>FitCloud</span>
        </div>

        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item">
            Dashboard
          </RouterLink>

          <RouterLink to="/workout" class="nav-item">
            Workout
          </RouterLink>

          <RouterLink to="/nutrition" class="nav-item">
            Nutrition
          </RouterLink>

          <RouterLink to="/progress" class="nav-item">
            Progress
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="motivation-card">
          <p>Train. Track. Improve.</p>
          <span>Build better habits with FitCloud.</span>
        </div>

        <button class="logout-button" @click="handleLogout">
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content. -->
    <main class="main-content">
      <h1>Today's Nutrition</h1>
      <p>Track your meals and daily nutrients.</p>

      <!-- Add Food form. -->
      <section>
        <h2>Add Food</h2>

        <input
          v-model="foodName"
          type="text"
          placeholder="Food name"
        />

        <input
          v-model="calories"
          type="number"
          placeholder="Calories"
        />

        <input
          v-model="protein"
          type="number"
          placeholder="Protein (g)"
        />

        <input
          v-model="carbs"
          type="number"
          placeholder="Carbs (g)"
        />

        <input
          v-model="fat"
          type="number"
          placeholder="Fat (g)"
        />

        <p v-if="formError">
          {{ formError }}
        </p>

        <button type="button" @click="addFood">
          Add Food
        </button>
      </section>

      <!-- Foods added to today's meals. -->
      <section>
        <h2>Today's Meals</h2>

        <p v-if="foods.length === 0">
          No food added yet.
        </p>

        <div
          v-for="(food, index) in foods"
          :key="index"
        >
          <strong>{{ food.foodName }}</strong>

          <p>
            {{ food.calories }} kcal ·
            Protein {{ food.protein }}g ·
            Carbs {{ food.carbs }}g ·
            Fat {{ food.fat }}g
          </p>

          <button type="button" @click="removeFood(index)">
            Remove
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { signOut } from 'aws-amplify/auth'

const router = useRouter()

// Store the user's food input.
const foodName = ref('')
const calories = ref('')
const protein = ref('')
const carbs = ref('')
const fat = ref('')

// Store food records added to today's meals.
const foods = ref([])

// Store validation error messages.
const formError = ref('')

// Sign the current user out and return to the login page.
const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

// Add a food record to today's meals.
const addFood = () => {
  formError.value = ''

  if (
    !foodName.value ||
    calories.value === '' ||
    protein.value === '' ||
    carbs.value === '' ||
    fat.value === ''
  ) {
    formError.value = 'Please complete all fields.'
    return
  }

  foods.value.push({
    foodName: foodName.value,
    calories: calories.value,
    protein: protein.value,
    carbs: carbs.value,
    fat: fat.value,
  })

  // Clear the form after adding the food.
  foodName.value = ''
  calories.value = ''
  protein.value = ''
  carbs.value = ''
  fat.value = ''
}

// Remove a food record from today's meals.
const removeFood = (index) => {
  foods.value.splice(index, 1)
}
</script>

<style scoped>
/* Page layout */
.app-shell {
  min-height: 100vh;
  display: flex;
  background: #f4f6f8;
  color: #172033;
}

/* Sidebar */
.sidebar {
  width: 230px;
  min-height: 100vh;
  background: #fffefd;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 36px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2f58b;
  border-radius: 12px;
  font-weight: 800;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  padding: 12px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: #172033;
  font-weight: 500;
}

.nav-item:hover {
  background: #f4f6f8;
}

.nav-item.router-link-exact-active {
  background: #e4f58f;
  color: #172033;
  font-weight: 700;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.motivation-card {
  background: #d8ecf8;
  padding: 18px;
  border-radius: 16px;
}

.motivation-card p {
  margin: 0 0 6px;
  font-weight: 700;
}

.motivation-card span {
  font-size: 0.85rem;
}

.logout-button {
  border: none;
  background: transparent;
  padding: 10px;
  cursor: pointer;
  color: #172033;
  font-weight: 600;
}

/* Main content */
.main-content {
  flex: 1;
  padding: 32px;
}
</style>