<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  deleteUser,
  fetchUserAttributes,
  getCurrentUser,
  signOut,
  updatePassword,
} from 'aws-amplify/auth'

const router = useRouter()
const route = useRoute()

const accountSections = ['profile', 'password', 'delete']
const currentSection = computed(() =>
  accountSections.includes(route.query.section) ? route.query.section : 'profile',
)

const email = ref('')
const username = ref('')
const displayName = ref('')
const weeklyWorkoutGoal = ref(3)
const dailyCalorieGoal = ref(2000)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const profileMessage = ref('')
const passwordMessage = ref('')
const passwordError = ref('')
const pageError = ref('')
const isLoading = ref(true)
const isSavingPassword = ref(false)

const storageKey = () => `repvelta-profile-${username.value || 'member'}`

const loadAccount = async () => {
  isLoading.value = true
  pageError.value = ''

  try {
    const [user, attributes] = await Promise.all([
      getCurrentUser(),
      fetchUserAttributes(),
    ])

    username.value = user.username
    email.value =
      attributes.email || user.signInDetails?.loginId || 'Email unavailable'

    const savedProfile = localStorage.getItem(storageKey())

    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      displayName.value = profile.displayName || ''
      weeklyWorkoutGoal.value = profile.weeklyWorkoutGoal ?? 3
      dailyCalorieGoal.value = profile.dailyCalorieGoal ?? 2000
    }
  } catch (error) {
    pageError.value = error.message || 'We could not load your account.'
  } finally {
    isLoading.value = false
  }
}

const saveProfile = () => {
  profileMessage.value = ''

  const workoutGoal = Number(weeklyWorkoutGoal.value)
  const calorieGoal = Number(dailyCalorieGoal.value)

  if (
    !Number.isFinite(workoutGoal) ||
    workoutGoal < 1 ||
    workoutGoal > 14 ||
    !Number.isFinite(calorieGoal) ||
    calorieGoal < 500 ||
    calorieGoal > 10000
  ) {
    profileMessage.value = 'Please enter realistic workout and calorie goals.'
    return
  }

  localStorage.setItem(
    storageKey(),
    JSON.stringify({
      displayName: displayName.value.trim(),
      weeklyWorkoutGoal: workoutGoal,
      dailyCalorieGoal: calorieGoal,
    }),
  )

  profileMessage.value = 'Your preferences have been saved on this device.'
}

const changePassword = async () => {
  passwordMessage.value = ''
  passwordError.value = ''

  if (!currentPassword.value) {
    passwordError.value = 'Enter your current password.'
    return
  }

  if (newPassword.value.length < 8) {
    passwordError.value = 'Your new password must contain at least 8 characters.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'The new passwords do not match.'
    return
  }

  isSavingPassword.value = true

  try {
    await updatePassword({
      oldPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordMessage.value = 'Your password has been updated.'
  } catch (error) {
    passwordError.value =
      error.name === 'NotAuthorizedException'
        ? 'Your current password is incorrect.'
        : error.message || 'We could not update your password.'
  } finally {
    isSavingPassword.value = false
  }
}

const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    'Delete your RepVelta account permanently? This cannot be undone.',
  )

  if (!confirmed) return

  try {
    await deleteUser()
    localStorage.removeItem(storageKey())
    router.push('/register')
  } catch (error) {
    pageError.value = error.message || 'We could not delete your account.'
  }
}

onMounted(loadAccount)
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-mark">R</div>
          <span>RepVelta</span>
        </div>

        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item"><span>▦</span> Dashboard</RouterLink>
          <RouterLink to="/workout" class="nav-item"><span>◫</span> Workout</RouterLink>
          <RouterLink to="/nutrition" class="nav-item"><span>◉</span> Nutrition</RouterLink>
          <RouterLink to="/progress" class="nav-item"><span>⌁</span> Progress</RouterLink>
          <RouterLink to="/coach" class="nav-item"><span>✦</span> AI Coach</RouterLink>
          <RouterLink to="/account" class="nav-item"><span>●</span> My Account</RouterLink>

          <div class="account-subnav" aria-label="Account settings">
            <RouterLink
              :to="{ path: '/account', query: { section: 'profile' } }"
              :class="['account-subnav-item', { active: currentSection === 'profile' }]"
            >
              Profile and goals
            </RouterLink>

            <RouterLink
              :to="{ path: '/account', query: { section: 'password' } }"
              :class="['account-subnav-item', { active: currentSection === 'password' }]"
            >
              Change password
            </RouterLink>

            <RouterLink
              :to="{ path: '/account', query: { section: 'delete' } }"
              :class="['account-subnav-item danger-subnav-item', { active: currentSection === 'delete' }]"
            >
              Delete account
            </RouterLink>
          </div>
        </nav>
      </div>

      <div>
        <div class="sidebar-card">
          <div class="sidebar-card-icon">✦</div>
          <h3>Your account.<br />Your goals.</h3>
          <p>Keep your personal settings and security details up to date.</p>
        </div>

        <button type="button" class="logout-button" @click="handleLogout">
          Logout
        </button>
      </div>
    </aside>

    <section class="main-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">ACCOUNT SETTINGS</p>
          <h1>My Account</h1>
          <p>Manage your profile, goals, and account security.</p>
        </div>

        <RouterLink to="/dashboard" class="back-link">← Back to Dashboard</RouterLink>
      </header>

      <div v-if="isLoading" class="state-card">Loading your account...</div>

      <div v-else-if="pageError" class="alert error-alert">{{ pageError }}</div>

      <template v-else>
        <section class="account-summary">
          <div class="avatar">{{ (displayName || email || 'R').charAt(0).toUpperCase() }}</div>
          <div>
            <h2>{{ displayName || 'RepVelta Member' }}</h2>
            <p>{{ email }}</p>
          </div>
        </section>

        <section class="settings-panel">
          <article v-if="currentSection === 'profile'" class="settings-card profile-card">
            <div class="card-heading">
              <div>
                <p class="eyebrow">PREFERENCES</p>
                <h2>Profile and goals</h2>
              </div>
              <span class="card-icon">◎</span>
            </div>

            <form class="settings-form" @submit.prevent="saveProfile">
              <div class="form-group">
                <label for="displayName">Display name</label>
                <input id="displayName" v-model="displayName" type="text" maxlength="40" placeholder="Your name" />
              </div>

              <div class="form-group">
                <label>Email address</label>
                <input :value="email" type="email" disabled />
                <small>Email is managed by your sign-in account.</small>
              </div>

              <div class="goal-grid">
                <div class="form-group">
                  <label for="workoutGoal">Weekly workout goal</label>
                  <input id="workoutGoal" v-model.number="weeklyWorkoutGoal" type="number" min="1" max="14" />
                </div>

                <div class="form-group">
                  <label for="calorieGoal">Daily calorie goal</label>
                  <input id="calorieGoal" v-model.number="dailyCalorieGoal" type="number" min="500" max="10000" step="50" />
                </div>
              </div>

              <p v-if="profileMessage" class="form-message">{{ profileMessage }}</p>

              <button type="submit" class="primary-button">Save preferences</button>
            </form>
          </article>

          <article v-else-if="currentSection === 'password'" class="settings-card security-card">
            <div class="card-heading">
              <div>
                <p class="eyebrow">SECURITY</p>
                <h2>Change password</h2>
              </div>
              <span class="card-icon">◇</span>
            </div>

            <form class="settings-form" @submit.prevent="changePassword">
              <div class="form-group">
                <label for="currentPassword">Current password</label>
                <input id="currentPassword" v-model="currentPassword" type="password" autocomplete="current-password" />
              </div>

              <div class="form-group">
                <label for="newPassword">New password</label>
                <input id="newPassword" v-model="newPassword" type="password" autocomplete="new-password" />
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm new password</label>
                <input id="confirmPassword" v-model="confirmPassword" type="password" autocomplete="new-password" />
              </div>

              <p v-if="passwordError" class="form-message error-text">{{ passwordError }}</p>
              <p v-if="passwordMessage" class="form-message">{{ passwordMessage }}</p>

              <button type="submit" class="primary-button" :disabled="isSavingPassword">
                {{ isSavingPassword ? 'Updating...' : 'Update password' }}
              </button>
            </form>
          </article>

          <section v-else class="danger-card">
            <div>
              <p class="eyebrow">DANGER ZONE</p>
              <h2>Delete account</h2>
              <p>Permanently delete your Cognito account and sign-in access. Your account cannot be restored after deletion.</p>
            </div>
            <button type="button" class="danger-button" @click="handleDeleteAccount">Delete my account</button>
          </section>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 270px 1fr; background: #f1f5f2; color: #172033; font-family: Inter, Arial, Helvetica, sans-serif; }
.sidebar { min-height: 100vh; padding: 36px 28px; border-right: 1px solid #dfe8e2; background: #fffefd; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 46px; font-size: 1.5rem; font-weight: 800; }
.brand-mark { width: 42px; height: 42px; border-radius: 12px; background: #cbed63; color: #17352c; display: grid; place-items: center; font-weight: 900; }
.nav-menu { display: flex; flex-direction: column; gap: 10px; }
.nav-item { display: flex; align-items: center; gap: 13px; padding: 14px 16px; border-radius: 12px; color: #52615d; font-size: 1.06rem; font-weight: 550; text-decoration: none; }
.nav-item span { min-width: 18px; text-align: center; }
.nav-item:hover { background: #eef4ef; }
.nav-item.router-link-exact-active { background: #dff09b; color: #17352c; font-weight: 750; }
.account-subnav { margin: -2px 0 4px 25px; padding: 3px 0 3px 18px; border-left: 2px solid #dfe8e2; display: flex; flex-direction: column; gap: 3px; }
.account-subnav-item { padding: 9px 11px; border-radius: 9px; color: #66736e; font-size: .92rem; font-weight: 650; line-height: 1.25; text-decoration: none; transition: background .2s ease, color .2s ease; }
.account-subnav-item:hover { background: #eef4ef; color: #315e51; }
.account-subnav-item.active { background: #eaf4c7; color: #17352c; font-weight: 800; }
.danger-subnav-item.active { background: #fee4e0; color: #8f251b; }
.sidebar-card { padding: 22px; border: 1px solid #d4e4d9; border-radius: 18px; background: #e5f0e8; }
.sidebar-card-icon { margin-bottom: 14px; font-size: 1.35rem; }
.sidebar-card h3 { margin: 0; font-size: 1.4rem; line-height: 1.12; }
.sidebar-card p { margin: 13px 0 0; color: #536760; font-size: 1rem; line-height: 1.55; }
.logout-button { width: 100%; margin-top: 18px; padding: 12px; border: 0; border-radius: 10px; background: transparent; color: #52615d; font-size: 1rem; font-weight: 650; cursor: pointer; }
.logout-button:hover { background: #eef4ef; }
.main-content { width: 100%; max-width: 1500px; margin: 0 auto; padding: 42px 50px 60px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
.eyebrow { margin: 0; color: #65717f; font-size: .95rem; font-weight: 800; letter-spacing: .1em; }
.topbar h1 { margin: 6px 0 8px; font-size: 2.6rem; }
.topbar > div > p:last-child { margin: 0; color: #596574; font-size: 1.1rem; line-height: 1.55; }
.back-link { padding: 12px 16px; border: 1px solid #dbe4de; border-radius: 12px; background: #fffefd; color: #315e51; font-size: 1rem; font-weight: 750; text-decoration: none; }
.state-card, .alert { padding: 24px; border-radius: 16px; background: #fffefd; font-size: 1.05rem; }
.error-alert { border: 1px solid #efc8c3; background: #fff2f0; color: #a52b20; }
.account-summary { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; padding: 24px 28px; border: 1px solid #d4e4d9; border-radius: 20px; background: linear-gradient(135deg, #e5f0e8 0%, #eef5df 100%); }
.avatar { width: 64px; height: 64px; border-radius: 18px; background: #cbed63; color: #17352c; display: grid; place-items: center; font-size: 1.6rem; font-weight: 900; }
.account-summary h2 { margin: 0; font-size: 1.5rem; }
.account-summary p { margin: 6px 0 0; color: #52615d; font-size: 1.02rem; }
.settings-panel { width: 100%; max-width: 1040px; min-width: 0; }
.settings-card { padding: 28px; border: 1px solid #e2e7e4; border-radius: 20px; background: #fffefd; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 24px; }
.card-heading h2 { margin: 6px 0 0; font-size: 1.45rem; }
.card-icon { width: 44px; height: 44px; border-radius: 14px; background: #dcefea; color: #315e51; display: grid; place-items: center; font-size: 1.2rem; font-weight: 900; }
.settings-form { display: flex; flex-direction: column; gap: 18px; }
.goal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 1rem; font-weight: 750; }
.form-group input { width: 100%; min-height: 52px; padding: 13px 15px; border: 1px solid #dce2df; border-radius: 12px; outline: none; background: #fff; color: #172033; font-size: 1rem; }
.form-group input:focus { border-color: #91ae3e; box-shadow: 0 0 0 3px rgba(203, 237, 99, .25); }
.form-group input:disabled { background: #f3f5f3; color: #68736f; }
.form-group small { color: #68736f; font-size: .92rem; line-height: 1.45; }
.form-message { margin: 0; padding: 12px 14px; border-radius: 10px; background: #edf5e9; color: #315e51; font-size: .98rem; line-height: 1.5; }
.error-text { background: #fff2f0; color: #a52b20; }
.primary-button { min-height: 52px; padding: 13px 20px; border: 0; border-radius: 12px; background: #cbed63; color: #17352c; font-size: 1rem; font-weight: 850; cursor: pointer; }
.primary-button:disabled { opacity: .65; cursor: wait; }
.danger-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 28px; border: 1px solid #efc8c3; border-radius: 20px; background: #fff9f8; }
.danger-card h2 { margin: 6px 0 8px; font-size: 1.35rem; }
.danger-card > div > p:last-child { margin: 0; color: #6f5f5d; font-size: 1rem; }
.danger-button { flex: 0 0 auto; padding: 13px 18px; border: 1px solid #c74435; border-radius: 12px; background: #fff; color: #a52b20; font-size: 1rem; font-weight: 800; cursor: pointer; }
.danger-button:hover { background: #fff0ee; }
@media (max-width: 1000px) { .app-shell { grid-template-columns: 1fr; } .sidebar { display: none; } }
@media (max-width: 650px) { .main-content { padding: 24px 16px 40px; } .topbar { align-items: flex-start; } .back-link { display: none; } .goal-grid { grid-template-columns: 1fr; } .danger-card { align-items: flex-start; flex-direction: column; } .danger-button { width: 100%; } }
</style>
