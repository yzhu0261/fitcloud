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
      <!-- Page header. -->
      <header class="topbar">
        <div>
          <p class="eyebrow">DAILY NUTRITION</p>
          <h1>Today's Nutrition</h1>
          <p class="subtitle">
            Track your meals and daily nutrients.
          </p>
        </div>

        <div class="account-pill">
          <span>My Account</span>
          <small>FitCloud Member</small>
        </div>
      </header>

      <!-- Display today's nutrition summary. -->
      <section class="nutrition-summary">
        <article class="summary-card blue-card">
          <p>Calories</p>
          <h2>{{ totalCalories }}</h2>
          <span>kcal</span>
        </article>

        <article class="summary-card yellow-card">
          <p>Protein</p>
          <h2>{{ totalProtein }}</h2>
          <span>g</span>
        </article>

        <article class="summary-card lime-card">
          <p>Carbs</p>
          <h2>{{ totalCarbs }}</h2>
          <span>g</span>
        </article>

        <article class="summary-card pink-card">
          <p>Fat</p>
          <h2>{{ totalFat }}</h2>
          <span>g</span>
        </article>
      </section>

      <!-- Add Food form. -->
      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">MEAL TRACKER</p>
            <h2>Add Food</h2>
          </div>
        </div>

        <div class="food-form">
          <div class="form-group food-name-field">
            <label>Food Name</label>
            <input
              v-model="foodName"
              type="text"
              placeholder="e.g. Chicken Breast"
            />
          </div>

          <div class="form-group">
            <label>Calories</label>
            <input
              v-model="calories"
              type="number"
              min="0"
              placeholder="kcal"
            />
          </div>

          <div class="form-group">
            <label>Protein</label>
            <input
              v-model="protein"
              type="number"
              min="0"
              placeholder="g"
            />
          </div>

          <div class="form-group">
            <label>Carbs</label>
            <input
              v-model="carbs"
              type="number"
              min="0"
              placeholder="g"
            />
          </div>

          <div class="form-group">
            <label>Fat</label>
            <input
              v-model="fat"
              type="number"
              min="0"
              placeholder="g"
            />
          </div>

          <button
            type="button"
            class="add-button"
            @click="addFood"
          >
            Add Food
          </button>
        </div>

        <p v-if="formError" class="form-error">
          {{ formError }}
        </p>
      </section>

      <!-- Display foods added to today's meals. -->
      <section class="content-card meals-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">TODAY</p>
            <h2>Today's Meals</h2>
          </div>

          <span class="food-count">
            {{ foods.length }} foods
          </span>
        </div>

        <div v-if="foods.length === 0" class="empty-state">
          <p>No food added yet.</p>
          <span>Add your first meal using the form above.</span>
        </div>

        <div v-else class="meal-list">
          <article
            v-for="(eachFood, index) in foods"
            :key="index"
            class="meal-item"
          >
            <div>
              <h3>{{ eachFood.foodName }}</h3>

              <p class="meal-calories">
                {{ eachFood.calories }} kcal
              </p>

              <p class="meal-macros">
                Protein {{ eachFood.protein }}g ·
                Carbs {{ eachFood.carbs }}g ·
                Fat {{ eachFood.fat }}g
              </p>
            </div>

            <button
              type="button"
              class="remove-button"
              @click="removeFood(index)"
            >
              Remove
            </button>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

// Calculate the total nutrition values from today's food records.
const totalCalories = computed(() => {
  return foods.value.reduce((total, food) => {
    return total + Number(food.calories)
  }, 0)
})

const totalProtein = computed(() => {
  return foods.value.reduce((total, food) => {
    return total + Number(food.protein)
  }, 0)
})

const totalCarbs = computed(() => {
  return foods.value.reduce((total, food) => {
    return total + Number(food.carbs)
  }, 0)
})

const totalFat = computed(() => {
  return foods.value.reduce((total, food) => {
    return total + Number(food.fat)
  }, 0)
})

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

/* Page header */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.topbar h1 {
  margin: 4px 0 6px;
  font-size: 2rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #687083;
}

.subtitle {
  margin: 0;
  color: #687083;
}

.account-pill {
  display: flex;
  flex-direction: column;
  background: #fffefd;
  padding: 10px 16px;
  border-radius: 14px;
}

.account-pill span {
  font-weight: 700;
}

.account-pill small {
  margin-top: 2px;
  color: #687083;
}

/* Nutrition summary */
.nutrition-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 22px;
  border-radius: 20px;
}

.summary-card p {
  margin: 0 0 16px;
  font-weight: 700;
}

.summary-card h2 {
  margin: 0;
  font-size: 2.2rem;
}

.summary-card span {
  font-size: 0.85rem;
  color: #596174;
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

.pink-card {
  background: #f6dfe7;
}

/* Content cards */
.content-card {
  background: #fffefd;
  padding: 24px;
  border-radius: 20px;
  margin-bottom: 24px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 4px 0 0;
}

/* Add Food form */
.food-form {
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #dfe3e8;
  border-radius: 12px;
  outline: none;
  background: #ffffff;
}

.form-group input:focus {
  border-color: #a9bc55;
}

.add-button {
  border: none;
  background: #e2f58b;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.form-error {
  margin: 14px 0 0;
  color: #b42318;
  font-size: 0.9rem;
}

/* Today's meals */
.food-count {
  background: #f4f6f8;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.empty-state {
  padding: 32px;
  text-align: center;
  background: #f7f8f9;
  border-radius: 16px;
}

.empty-state p {
  margin: 0 0 5px;
  font-weight: 700;
}

.empty-state span {
  color: #687083;
  font-size: 0.9rem;
}

.meal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  background: #f7f8f9;
  border-radius: 16px;
}

.meal-item h3 {
  margin: 0 0 5px;
}

.meal-calories {
  margin: 0 0 5px;
  font-weight: 700;
}

.meal-macros {
  margin: 0;
  color: #687083;
  font-size: 0.9rem;
}

.remove-button {
  border: none;
  background: #ffffff;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

/* Responsive layout */
@media (max-width: 1000px) {
  .nutrition-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .food-form {
    grid-template-columns: repeat(2, 1fr);
  }

  .add-button {
    grid-column: 1 / -1;
  }
}
</style>