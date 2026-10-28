<template>
  <div class="app-shell">
    <!-- Sidebar navigation. -->
    <aside class="sidebar">
      <div>
        <div class="brand">
          <BrandMark />
          <span>RepVelta</span>
        </div>

        <AppNavigation />
      </div>

      <div class="sidebar-bottom">
        <div class="motivation-card">
          <p>Train. Track. Improve.</p>
          <span>Build better habits with RepVelta.</span>
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

        <UserProfileBadge />
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

      <section class="calorie-goal-card" aria-labelledby="calorie-goal-heading">
        <div class="goal-copy">
          <p class="eyebrow">DAILY GOAL</p>
          <h2 id="calorie-goal-heading">Calorie target</h2>
          <p>{{ calorieGoalMessage }}</p>
        </div>
        <div class="goal-stats">
          <strong>{{ totalCalories.toLocaleString('en-AU') }}</strong>
          <span>of {{ dailyCalorieGoal.toLocaleString('en-AU') }} kcal</span>
        </div>
        <div
          class="goal-progress"
          role="progressbar"
          :aria-label="`${calorieGoalProgress}% of daily calorie target`"
          :aria-valuenow="calorieGoalProgress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span :style="{ width: `${calorieGoalProgress}%` }"></span>
        </div>
        <p class="goal-note">
          Includes {{ savedFoodsToday.length }} saved and {{ foods.length }} pending food{{ savedFoodsToday.length + foods.length === 1 ? '' : 's' }} today.
        </p>
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

        <div class="food-suggestions">
          <div class="suggestion-heading">
            <div>
              <strong>{{ recentFoodPresets.length ? 'Recently logged' : 'Quick foods' }}</strong>
              <span>Values are editable before adding</span>
            </div>
            <small v-if="!recentFoodPresets.length">Approximate values per listed serving</small>
          </div>
          <div class="suggestion-list">
            <button
              v-for="preset in suggestedFoods"
              :key="preset.foodName.toLowerCase()"
              type="button"
              :class="{ selected: foodName === preset.foodName }"
              @click="chooseFood(preset)"
            >
              <span>{{ preset.foodName }}</span>
              <small>{{ preset.calories }} kcal</small>
            </button>
          </div>
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
            {{ foods.length }} {{ foods.length === 1 ? 'food' : 'foods' }}
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

        <button
          class="save-btn"
          :disabled="foods.length === 0 || isSaving"
          @click="saveNutrition"
        >
          {{ isSaving ? 'Saving…' : 'Save Nutrition' }}
        </button>

        <p v-if="saveMessage" class="save-message">
          {{ saveMessage }}
        </p>
      </section>

      <!-- Display saved nutrition history from AWS. -->
      <section class="content-card history-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">HISTORY</p>
            <h2>Nutrition History</h2>
          </div>

          <span class="food-count">
            {{ nutritionHistory.length }} records
          </span>
        </div>

        <div v-if="isLoadingHistory" class="empty-state" aria-live="polite">
          <div class="history-spinner"></div>
          <p>Loading nutrition history...</p>
        </div>

        <div v-else-if="historyError" class="history-error" role="alert">
          <p>{{ historyError }}</p>
          <button type="button" @click="loadNutrition">Try again</button>
        </div>

        <!-- Show this message when the user has no saved nutrition records. -->
        <div v-else-if="nutritionHistory.length === 0" class="empty-state">
          <p>No nutrition history yet.</p>
          <span>Saved nutrition records will appear here.</span>
        </div>

        <!-- Display each saved nutrition record. -->
        <div v-else class="history-list">
          <article
            v-for="record in nutritionHistory"
            :key="record.nutritionId"
            class="history-item"
          >
            <!-- Display the record date and delete button. -->
            <div class="history-header">
              <h3>{{ record.date }}</h3>

              <button
                type="button"
                class="delete-history-button"
                :disabled="Boolean(deletingNutritionId)"
                @click="nutritionPendingDelete = record.nutritionId"
              >
                Delete
              </button>
            </div>

            <div
              v-if="nutritionPendingDelete === record.nutritionId"
              class="delete-confirmation"
              role="alert"
            >
              <p>
                <strong>Delete this nutrition record?</strong>
                <span>This cannot be undone.</span>
              </p>
              <button
                type="button"
                :disabled="Boolean(deletingNutritionId)"
                @click="nutritionPendingDelete = ''"
              >
                Cancel
              </button>
              <button
                type="button"
                class="confirm-delete-button"
                :disabled="Boolean(deletingNutritionId)"
                @click="deleteNutrition(record.nutritionId)"
              >
                {{ deletingNutritionId === record.nutritionId ? 'Deleting…' : 'Delete' }}
              </button>
            </div>

            <!-- Display every food stored inside this nutrition record. -->
            <div
              v-for="(food, index) in record.foods"
              :key="index"
              class="history-food"
            >
              <span>{{ food.foodName }}</span>

              <span>
                {{ food.calories }} kcal ·
                P {{ food.protein }}g ·
                C {{ food.carbs }}g ·
                F {{ food.fat }}g
              </span>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth'
import UserProfileBadge from '../components/UserProfileBadge.vue'
import BrandMark from '../components/BrandMark.vue'
import AppNavigation from '../components/AppNavigation.vue'

const router = useRouter()

const FOOD_PRESETS = [
  { foodName: 'Chicken Breast (100 g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { foodName: 'Cooked White Rice (1 cup)', calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4 },
  { foodName: 'Eggs (2 large)', calories: 144, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { foodName: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { foodName: 'Oats (50 g)', calories: 190, protein: 6.5, carbs: 33, fat: 3.5 },
  { foodName: 'Greek Yogurt (200 g)', calories: 118, protein: 20, carbs: 7, fat: 0.8 },
  { foodName: 'Salmon (100 g)', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { foodName: 'Whey Protein (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 2 },
]

// Store the user's food input.
const foodName = ref('')
const calories = ref('')
const protein = ref('')
const carbs = ref('')
const fat = ref('')
const dailyCalorieGoal = ref(2000)

// Store food records added to today's meals.
const foods = ref([])

// Store nutrition records loaded from the backend.
const nutritionHistory = ref([])

const toLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const today = computed(() => toLocalDate(new Date()))

const savedFoodsToday = computed(() =>
  nutritionHistory.value
    .filter((record) => record.date === today.value)
    .flatMap((record) => record.foods ?? []),
)

const todaysFoods = computed(() => [...savedFoodsToday.value, ...foods.value])

const recentFoodPresets = computed(() => {
  const seen = new Set()

  return [...nutritionHistory.value]
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .flatMap((record) => record.foods ?? [])
    .filter((food) => {
      const key = String(food.foodName || '').trim().toLowerCase()

      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 6)
})

const suggestedFoods = computed(() =>
  recentFoodPresets.value.length ? recentFoodPresets.value : FOOD_PRESETS.slice(0, 6),
)

const chooseFood = (preset) => {
  foodName.value = preset.foodName
  calories.value = preset.calories
  protein.value = preset.protein
  carbs.value = preset.carbs
  fat.value = preset.fat
  formError.value = ''
}

// Calculate the total nutrition values from today's food records.
const totalCalories = computed(() => {
  return todaysFoods.value.reduce((total, food) => {
    return total + Number(food.calories)
  }, 0)
})

const totalProtein = computed(() => {
  return todaysFoods.value.reduce((total, food) => {
    return total + Number(food.protein)
  }, 0)
})

const totalCarbs = computed(() => {
  return todaysFoods.value.reduce((total, food) => {
    return total + Number(food.carbs)
  }, 0)
})

const totalFat = computed(() => {
  return todaysFoods.value.reduce((total, food) => {
    return total + Number(food.fat)
  }, 0)
})

const calorieGoalProgress = computed(() =>
  Math.min(100, Math.round((totalCalories.value / dailyCalorieGoal.value) * 100)),
)

const calorieGoalMessage = computed(() => {
  const difference = dailyCalorieGoal.value - totalCalories.value

  if (difference > 0) return `${difference.toLocaleString('en-AU')} kcal remaining today`
  if (difference < 0) return `${Math.abs(difference).toLocaleString('en-AU')} kcal above your target`
  return 'Daily target reached'
})

const loadCalorieGoal = async () => {
  try {
    const user = await getCurrentUser()
    const savedProfile = localStorage.getItem(`repvelta-profile-${user.username}`)

    if (!savedProfile) return

    const savedGoal = Number(JSON.parse(savedProfile).dailyCalorieGoal)

    if (Number.isFinite(savedGoal) && savedGoal >= 500 && savedGoal <= 10000) {
      dailyCalorieGoal.value = savedGoal
    }
  } catch {
    dailyCalorieGoal.value = 2000
  }
}

// Store validation error messages.
const formError = ref('')

// Store the success message after saving nutrition data.
const saveMessage = ref('')
const isLoadingHistory = ref(true)
const historyError = ref('')
const isSaving = ref(false)
const deletingNutritionId = ref('')
const nutritionPendingDelete = ref('')

// Sign the current user out and return to the login page.
const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

// Add a food record to today's meals.
const addFood = () => {
  formError.value = ''

  // Clear the previous save message when starting a new nutrition record.
  saveMessage.value = ''

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

// Load the current user's saved nutrition records from AWS.
const loadNutrition = async () => {
  isLoadingHistory.value = true
  historyError.value = ''

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) throw new Error('Your session has expired. Please sign in again.')

    const response = await fetch(
      'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com/nutrition',
      {
        method: 'GET',
        headers: { Authorization: idToken },
      },
    )
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Your nutrition history could not be loaded.')
    }

    nutritionHistory.value = Array.isArray(result) ? result : (result.nutrition ?? [])
  } catch (error) {
    historyError.value = error.message || 'Your nutrition history could not be loaded.'
  } finally {
    isLoadingHistory.value = false
  }
}

// Load saved nutrition records when the Nutrition page opens.
onMounted(() => {
  loadNutrition()
  loadCalorieGoal()
})

const saveNutrition = async () => {
  if (isSaving.value || foods.value.length === 0) return

  isSaving.value = true
  formError.value = ''
  saveMessage.value = ''

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) throw new Error('Your session has expired. Please sign in again.')

    const response = await fetch(
      'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com/nutrition',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: idToken,
        },
        body: JSON.stringify({
          date: toLocalDate(new Date()),
          foods: foods.value,
        }),
      },
    )
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Your nutrition could not be saved.')
    }

    saveMessage.value = 'Nutrition saved successfully!'
    foods.value = []
    await loadNutrition()
  } catch (error) {
    formError.value = error.message || 'Your nutrition could not be saved.'
  } finally {
    isSaving.value = false
  }
}

// Delete one saved nutrition record from AWS.
const deleteNutrition = async (nutritionId) => {
  if (!nutritionId || deletingNutritionId.value) return

  deletingNutritionId.value = nutritionId
  historyError.value = ''
  saveMessage.value = ''

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) throw new Error('Your session has expired. Please sign in again.')

    const response = await fetch(
      `https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com/nutrition/${encodeURIComponent(nutritionId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: idToken },
      },
    )

    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      throw new Error(result.message || 'The nutrition record could not be deleted.')
    }

    nutritionPendingDelete.value = ''
    saveMessage.value = 'Nutrition record deleted successfully.'
    await loadNutrition()
  } catch (error) {
    historyError.value = error.message || 'The nutrition record could not be deleted.'
  } finally {
    deletingNutritionId.value = ''
  }
}
</script>

<style scoped>
/* Page layout */
.app-shell {
  min-height: 100vh;
  display: flex;
  background: #f1f5f2;
  color: #172033;
  font-family: Inter, Arial, Helvetica, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 270px;
  flex: 0 0 270px;
  min-height: 100vh;
  background: #fffefd;
  padding: 36px 28px;
  border-right: 1px solid #dfe8e2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 46px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #cbed63;
  color: #17352c;
  border-radius: 12px;
  font-weight: 800;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  padding: 14px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #52615d;
  font-size: 1.06rem;
  font-weight: 500;
}

.nav-item:hover {
  background: #eef4ef;
}

.nav-item.router-link-exact-active {
  background: #dff09b;
  color: #17352c;
  font-weight: 700;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.motivation-card {
  background: #e5f0e8;
  padding: 22px;
  border: 1px solid #d4e4d9;
  border-radius: 16px;
}

.motivation-card p {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 1.15rem;
}

.motivation-card span {
  color: #536760;
  font-size: 1rem;
  line-height: 1.5;
}

.logout-button {
  width: 100%;
  min-height: 48px;
  border: none;
  background: transparent;
  padding: 13px 16px;
  cursor: pointer;
  color: #52615d;
  font-size: 1.12rem;
  font-weight: 700;
}

/* Main content */
.main-content {
  flex: 1;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 42px 50px 60px;
}

/* Page header */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 34px;
}

.topbar h1 {
  margin: 4px 0 6px;
  font-size: 2.6rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #687083;
}

.subtitle {
  margin: 0;
  color: #687083;
  font-size: 1.1rem;
  line-height: 1.55;
}

.account-pill {
  display: flex;
  flex-direction: column;
  background: #fffefd;
  padding: 12px 18px;
  border-radius: 14px;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
  border: 1px solid #e7e9ed;
}

.account-pill:hover {
  border-color: #b8ca75;
  transform: translateY(-1px);
}

.account-pill span {
  font-weight: 700;
  font-size: 1rem;
}

.account-pill small {
  margin-top: 2px;
  color: #687083;
  font-size: 0.88rem;
}

/* Nutrition summary */
.nutrition-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  min-height: 180px;
  padding: 26px;
  border-radius: 20px;
}

.summary-card p {
  margin: 0 0 16px;
  font-weight: 700;
  font-size: 1.02rem;
}

.summary-card h2 {
  margin: 0;
  font-size: 3rem;
}

.summary-card span {
  font-size: 0.95rem;
  color: #596174;
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

.pink-card {
  background: #f6dfe7;
}

.calorie-goal-card {
  margin-bottom: 24px;
  padding: 24px 26px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px 28px;
  border: 1px solid #d7e4d9;
  border-radius: 20px;
  background: linear-gradient(120deg, #e3f0e7, #f4f8df);
}

.goal-copy h2 {
  margin: 5px 0 6px;
  font-size: 1.45rem;
}

.goal-copy > p:last-child {
  margin: 0;
  color: #52655e;
  font-size: 1rem;
}

.goal-stats {
  display: flex;
  align-items: baseline;
  gap: 7px;
  white-space: nowrap;
}

.goal-stats strong {
  color: #173f34;
  font-size: 2rem;
}

.goal-stats span {
  color: #607069;
  font-size: 0.92rem;
  font-weight: 700;
}

.goal-progress {
  grid-column: 1 / -1;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(23, 63, 52, 0.1);
}

.goal-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #86ae3d, #cbed63);
  transition: width 0.35s ease;
}

.goal-note {
  grid-column: 1 / -1;
  margin: -7px 0 0;
  color: #68766f;
  font-size: 0.84rem;
}

/* Content cards */
.content-card {
  background: #fffefd;
  padding: 28px;
  border: 1px solid #e7e9ec;
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
  font-size: 1.4rem;
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
  font-size: 1rem;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;
  min-height: 52px;
  padding: 13px 14px;
  border: 1px solid #dfe3e8;
  border-radius: 12px;
  outline: none;
  background: #ffffff;
  color: #172033;
  font-size: 1rem;
}

.form-group input:focus {
  border-color: #a9bc55;
}

.food-suggestions {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e4eae6;
  border-radius: 14px;
  background: #f7faf8;
}

.suggestion-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.suggestion-heading > div {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.suggestion-heading strong {
  font-size: 0.95rem;
}

.suggestion-heading span,
.suggestion-heading > small {
  color: #718079;
  font-size: 0.82rem;
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

.suggestion-list button small {
  color: #718079;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.add-button {
  border: none;
  background: #cbed63;
  color: #17352c;
  min-height: 52px;
  padding: 13px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}

.form-error {
  margin: 14px 0 0;
  color: #b42318;
  font-size: 1rem;
}

/* Today's meals */
.food-count {
  background: #f4f6f8;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.95rem;
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
  font-size: 1.05rem;
}

.empty-state span {
  color: #687083;
  font-size: 1rem;
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
  padding: 20px;
  background: #f7f8f9;
  border-radius: 16px;
}

.meal-item h3 {
  margin: 0 0 5px;
  font-size: 1.15rem;
}

.meal-calories {
  margin: 0 0 5px;
  font-weight: 700;
  font-size: 1.02rem;
}

.meal-macros {
  margin: 0;
  color: #687083;
  font-size: 1rem;
}

.remove-button {
  border: none;
  background: #ffffff;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.save-btn {
  width: 100%;
  margin-top: 20px;
  padding: 14px;
  border: 0;
  border-radius: 12px;
  background: #cbed63;
  color: #17352c;
  font-size: 1.02rem;
  font-weight: 800;
  cursor: pointer;
}

.save-btn:disabled {
  background: #e8ece9;
  color: #919b97;
  cursor: not-allowed;
}

.save-message {
  margin: 14px 0 0;
  color: #315e51;
  font-size: 1rem;
  font-weight: 650;
}

/* Nutrition history */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.history-item {
  padding: 20px;
  background: #f7f8f9;
  border-radius: 16px;
}

.history-item h3 {
  margin: 0 0 12px;
  font-size: 1.12rem;
}

.history-food {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
  color: #687083;
  font-size: 1rem;
}

.history-food + .history-food {
  border-top: 1px solid #e5e7eb;
}

/* Header for each saved nutrition record. */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* Delete button for a saved nutrition record. */
.delete-history-button {
  border: none;
  background: #ffffff;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.delete-history-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.delete-confirmation {
  margin: 0 0 12px;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 11px;
  background: #fff0ed;
}

.delete-confirmation p {
  margin: 0 auto 0 0;
  display: flex;
  flex-direction: column;
  color: #7e322b;
  font-size: 0.92rem;
}

.delete-confirmation p span {
  margin-top: 2px;
  color: #985f58;
}

.delete-confirmation button {
  padding: 8px 11px;
  border: 1px solid #d8c2be;
  border-radius: 9px;
  background: white;
  color: #5b4c49;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 750;
  cursor: pointer;
}

.delete-confirmation .confirm-delete-button {
  border-color: #a33b31;
  background: #a33b31;
  color: white;
}

.delete-confirmation button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.history-error {
  margin: 16px 0;
  padding: 14px;
  border-radius: 11px;
  background: #fff1f0;
  color: #8f2e25;
}

.history-error p {
  margin: 0 0 10px;
}

.history-error button {
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: #8f2e25;
  color: white;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}

.history-spinner {
  width: 30px;
  height: 30px;
  border: 4px solid #dfe8e2;
  border-top-color: #79a337;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

@media (max-width: 900px) {
  .sidebar {
    display: none;
  }

  .main-content {
    padding: 32px 24px 48px;
  }
}

@media (max-width: 600px) {
  .nutrition-summary,
  .food-form {
    grid-template-columns: 1fr;
  }

  .account-pill {
    display: none;
  }

  .main-content {
    padding: 24px 16px 40px;
  }

  .calorie-goal-card {
    grid-template-columns: 1fr;
  }

  .goal-stats,
  .goal-progress,
  .goal-note {
    grid-column: 1;
  }

  .suggestion-heading,
  .suggestion-heading > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .suggestion-list button {
    width: 100%;
    justify-content: space-between;
    border-radius: 11px;
  }

  .delete-confirmation {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .delete-confirmation p {
    width: 100%;
  }
}
</style>
