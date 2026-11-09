<script setup>
import { computed, onMounted, ref } from 'vue'
import { signOut } from 'aws-amplify/auth'
import { useRouter } from 'vue-router'
import AppNavigation from '../components/AppNavigation.vue'
import BrandMark from '../components/BrandMark.vue'
import UserProfileBadge from '../components/UserProfileBadge.vue'
import {
  createBodyMetric,
  deleteBodyMetric,
  loadBodyMetrics,
  updateBodyMetric,
} from '../services/bodyMetrics'

const router = useRouter()
const metrics = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const deletingId = ref('')
const editingId = ref('')
const pageError = ref('')
const notice = ref('')

const toLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const emptyForm = () => ({
  date: toLocalDate(new Date()),
  weightKg: '',
  bodyFatPercent: '',
  waistCm: '',
  note: '',
})

const form = ref(emptyForm())
const today = toLocalDate(new Date())

const sortedMetrics = computed(() =>
  [...metrics.value].sort((a, b) => String(b.date).localeCompare(String(a.date))),
)

const weightRecords = computed(() =>
  [...metrics.value]
    .filter(
      (item) =>
        item.weightKg !== null &&
        item.weightKg !== undefined &&
        Number.isFinite(Number(item.weightKg)),
    )
    .sort((a, b) => String(a.date).localeCompare(String(b.date))),
)

const weightTrend = computed(() => weightRecords.value.slice(-12))
const latestMetric = computed(() => sortedMetrics.value[0] || null)
const latestWeight = computed(() => weightRecords.value.at(-1)?.weightKg ?? null)
const firstWeight = computed(() => weightRecords.value[0]?.weightKg ?? null)
const weightChange = computed(() => {
  if (latestWeight.value === null || firstWeight.value === null) return null
  return Number(latestWeight.value) - Number(firstWeight.value)
})

const latestValue = (key) =>
  sortedMetrics.value.find((item) => item[key] !== null && item[key] !== undefined)?.[key] ?? null

const latestBodyFat = computed(() => latestValue('bodyFatPercent'))
const latestWaist = computed(() => latestValue('waistCm'))
const trendMinimum = computed(() => Math.min(...weightTrend.value.map((item) => Number(item.weightKg))))
const trendMaximum = computed(() => Math.max(...weightTrend.value.map((item) => Number(item.weightKg))))

const weightBarHeight = (weight) => {
  if (trendMaximum.value === trendMinimum.value) return '72%'
  const ratio = (Number(weight) - trendMinimum.value) / (trendMaximum.value - trendMinimum.value)
  return `${Math.round(30 + ratio * 70)}%`
}

const formatDate = (value) => {
  if (!value) return 'Date unavailable'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

const optionalNumber = (value) => (value === '' ? null : Number(value))

const resetForm = () => {
  form.value = emptyForm()
  editingId.value = ''
  pageError.value = ''
}

const validateForm = () => {
  if (!form.value.date || form.value.date > today) {
    return 'Please choose today or an earlier date.'
  }

  const weightKg = optionalNumber(form.value.weightKg)
  const bodyFatPercent = optionalNumber(form.value.bodyFatPercent)
  const waistCm = optionalNumber(form.value.waistCm)

  if (weightKg === null && bodyFatPercent === null && waistCm === null) {
    return 'Enter at least one body measurement.'
  }
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500)) {
    return 'Weight must be between 20 and 500 kg.'
  }
  if (
    bodyFatPercent !== null &&
    (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 1 || bodyFatPercent > 75)
  ) {
    return 'Body fat must be between 1% and 75%.'
  }
  if (waistCm !== null && (!Number.isFinite(waistCm) || waistCm < 30 || waistCm > 300)) {
    return 'Waist measurement must be between 30 and 300 cm.'
  }

  return ''
}

const loadMetrics = async () => {
  isLoading.value = true
  pageError.value = ''

  try {
    metrics.value = await loadBodyMetrics()
  } catch (error) {
    pageError.value = error.message || 'Your body measurements could not be loaded.'
  } finally {
    isLoading.value = false
  }
}

const saveMetric = async () => {
  const validationError = validateForm()
  if (validationError) {
    pageError.value = validationError
    return
  }

  isSaving.value = true
  pageError.value = ''
  notice.value = ''
  const payload = {
    date: form.value.date,
    weightKg: optionalNumber(form.value.weightKg),
    bodyFatPercent: optionalNumber(form.value.bodyFatPercent),
    waistCm: optionalNumber(form.value.waistCm),
    note: form.value.note.trim().slice(0, 300),
  }

  try {
    if (editingId.value) {
      const updated = await updateBodyMetric({ ...payload, metricId: editingId.value })
      metrics.value = metrics.value.map((item) =>
        item.metricId === editingId.value ? updated : item,
      )
      notice.value = 'Body measurement updated.'
    } else {
      const created = await createBodyMetric(payload)
      metrics.value = [...metrics.value, created]
      notice.value = 'Body measurement saved.'
    }

    resetForm()
  } catch (error) {
    pageError.value = error.message || 'Your body measurement could not be saved.'
  } finally {
    isSaving.value = false
  }
}

const editMetric = (metric) => {
  editingId.value = metric.metricId
  form.value = {
    date: metric.date,
    weightKg: metric.weightKg ?? '',
    bodyFatPercent: metric.bodyFatPercent ?? '',
    waistCm: metric.waistCm ?? '',
    note: metric.note ?? '',
  }
  pageError.value = ''
  notice.value = ''
  document.getElementById('body-entry-form')?.scrollIntoView({ behavior: 'smooth' })
}

const removeMetric = async (metric) => {
  if (!window.confirm(`Delete the body measurement from ${formatDate(metric.date)}?`)) return

  deletingId.value = metric.metricId
  pageError.value = ''

  try {
    await deleteBodyMetric(metric.metricId)
    metrics.value = metrics.value.filter((item) => item.metricId !== metric.metricId)
    if (editingId.value === metric.metricId) resetForm()
    notice.value = 'Body measurement deleted.'
  } catch (error) {
    pageError.value = error.message || 'The body measurement could not be deleted.'
  } finally {
    deletingId.value = ''
  }
}

const handleLogout = async () => {
  await signOut()
  router.push('/login')
}

onMounted(loadMetrics)
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand"><BrandMark /><span>RepVelta</span></div>
        <AppNavigation />
      </div>
      <div>
        <div class="sidebar-card"><span>✦</span><h3>Measure.<br />Review.<br />Progress.</h3><p>Small changes become easier to see when you track them consistently.</p></div>
        <button type="button" class="logout-button" @click="handleLogout">Logout</button>
      </div>
    </aside>

    <section class="main-content">
      <header class="topbar">
        <div><p class="eyebrow">BODY PROGRESS</p><h1>Body metrics</h1><p>Track changes in weight and body measurements over time.</p></div>
        <UserProfileBadge />
      </header>

      <div v-if="isLoading" class="state-card"><div class="spinner"></div><p>Loading body measurements…</p></div>

      <template v-else>
        <div v-if="pageError" class="alert error-alert" role="alert">{{ pageError }}</div>
        <div v-if="notice" class="alert success-alert" role="status">{{ notice }}</div>

        <section class="summary-grid">
          <article class="summary-card blue-card"><span>Latest weight</span><strong>{{ latestWeight === null ? '—' : latestWeight }}</strong><small>{{ latestWeight === null ? 'No weight recorded' : 'kg' }}</small></article>
          <article class="summary-card yellow-card"><span>Change since first</span><strong>{{ weightChange === null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` }}</strong><small>{{ weightChange === null ? 'Add two weight records' : 'kg' }}</small></article>
          <article class="summary-card lime-card"><span>Latest body fat</span><strong>{{ latestBodyFat === null ? '—' : latestBodyFat }}</strong><small>{{ latestBodyFat === null ? 'Optional measurement' : '%' }}</small></article>
          <article class="summary-card pink-card"><span>Latest waist</span><strong>{{ latestWaist === null ? '—' : latestWaist }}</strong><small>{{ latestWaist === null ? 'Optional measurement' : 'cm' }}</small></article>
        </section>

        <section class="trend-card" aria-labelledby="weight-trend-heading">
          <div class="section-heading">
            <div><p class="eyebrow">LAST 12 ENTRIES</p><h2 id="weight-trend-heading">Weight trend</h2></div>
            <span v-if="latestMetric">Last entry {{ formatDate(latestMetric.date) }}</span>
          </div>
          <div v-if="weightTrend.length" class="weight-chart" :style="{ '--entry-count': weightTrend.length }" role="img" aria-label="Weight history chart">
            <div v-for="entry in weightTrend" :key="entry.metricId" class="weight-column" :title="`${formatDate(entry.date)}: ${entry.weightKg} kg`">
              <strong>{{ entry.weightKg }}</strong>
              <div class="weight-track"><span :style="{ height: weightBarHeight(entry.weightKg) }"></span></div>
              <small>{{ formatDate(entry.date).replace(/ \d{4}$/, '') }}</small>
            </div>
          </div>
          <div v-else class="empty-state">Add a weight measurement to begin your trend chart.</div>
        </section>

        <section class="content-grid">
          <article id="body-entry-form" class="content-card form-card">
            <div class="section-heading"><div><p class="eyebrow">{{ editingId ? 'EDIT ENTRY' : 'NEW ENTRY' }}</p><h2>{{ editingId ? 'Update measurement' : 'Record measurements' }}</h2></div></div>
            <form @submit.prevent="saveMetric">
              <label>Date<input v-model="form.date" type="date" :max="today" /></label>
              <div class="measurement-grid">
                <label>Weight <span>kg</span><input v-model.number="form.weightKg" type="number" min="20" max="500" step="0.1" placeholder="72.5" /></label>
                <label>Body fat <span>%</span><input v-model.number="form.bodyFatPercent" type="number" min="1" max="75" step="0.1" placeholder="Optional" /></label>
                <label>Waist <span>cm</span><input v-model.number="form.waistCm" type="number" min="30" max="300" step="0.1" placeholder="Optional" /></label>
              </div>
              <label>Note <textarea v-model="form.note" maxlength="300" rows="3" placeholder="Optional context, such as morning measurement"></textarea></label>
              <div class="form-actions">
                <button v-if="editingId" type="button" class="secondary-button" @click="resetForm">Cancel</button>
                <button type="submit" class="primary-button" :disabled="isSaving">{{ isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Save measurement' }}</button>
              </div>
            </form>
          </article>

          <article class="content-card history-card">
            <div class="section-heading"><div><p class="eyebrow">HISTORY</p><h2>Measurement records</h2></div><span>{{ metrics.length }} entries</span></div>
            <div v-if="sortedMetrics.length" class="history-list">
              <div v-for="metric in sortedMetrics" :key="metric.metricId" class="history-item">
                <time :datetime="metric.date">{{ formatDate(metric.date) }}</time>
                <div class="history-values">
                  <strong v-if="metric.weightKg != null">{{ metric.weightKg }} kg</strong>
                  <span v-if="metric.bodyFatPercent != null">Body fat {{ metric.bodyFatPercent }}%</span>
                  <span v-if="metric.waistCm != null">Waist {{ metric.waistCm }} cm</span>
                  <p v-if="metric.note">{{ metric.note }}</p>
                </div>
                <div class="history-actions">
                  <button type="button" @click="editMetric(metric)">Edit</button>
                  <button type="button" class="delete-button" :disabled="deletingId === metric.metricId" @click="removeMetric(metric)">{{ deletingId === metric.metricId ? 'Deleting…' : 'Delete' }}</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">Your saved measurements will appear here.</div>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 270px minmax(0, 1fr); background: #f2f6f3; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
.sidebar { position: sticky; top: 0; height: 100vh; padding: 28px 22px 24px; display: flex; justify-content: space-between; flex-direction: column; border-right: 1px solid #e3e9e5; background: #fffefd; }.brand { display: flex; align-items: center; gap: 12px; margin: 0 4px 30px; color: #172033; font-size: 1.35rem; font-weight: 850; }.sidebar-card { margin-top: 28px; padding: 18px; border-radius: 18px; background: #e6f0e9; }.sidebar-card > span { color: #315e51; }.sidebar-card h3 { margin: 12px 0 8px; font-size: 1.25rem; line-height: 1.08; }.sidebar-card p { margin: 0; color: #607069; font-size: .92rem; line-height: 1.5; }.logout-button { width: 100%; margin-top: 14px; padding: 12px; border: 0; background: transparent; color: #53615d; font: inherit; font-size: 1rem; font-weight: 750; cursor: pointer; }
.main-content { width: 100%; max-width: 1500px; margin: 0 auto; padding: 42px 50px 60px; }.topbar { margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }.topbar h1 { margin: 5px 0 7px; font-size: 2.6rem; }.topbar > div > p:last-child { margin: 0; color: #596574; font-size: 1.08rem; }.eyebrow { margin: 0; color: #69766f; font-size: .86rem; font-weight: 850; letter-spacing: .11em; }
.alert { margin-bottom: 18px; padding: 13px 15px; border-radius: 12px; font-size: .96rem; font-weight: 700; }.error-alert { border: 1px solid #efc7c0; background: #fff1ef; color: #9d342b; }.success-alert { border: 1px solid #cde0b4; background: #f1f8df; color: #3c642f; }
.summary-grid { margin-bottom: 22px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }.summary-card { min-height: 170px; padding: 24px; border-radius: 19px; }.summary-card > span { display: block; margin-bottom: 20px; font-size: .96rem; font-weight: 750; }.summary-card strong { display: block; overflow: hidden; font-size: 2.8rem; line-height: 1; text-overflow: ellipsis; }.summary-card small { display: block; margin-top: 11px; color: #52615d; font-size: .9rem; }.blue-card { background: #dcefea; }.yellow-card { background: #fff1a8; }.lime-card { background: #e2f58b; }.pink-card { background: #f6dfe7; }
.trend-card, .content-card, .state-card { border: 1px solid #dfe7e2; border-radius: 20px; background: #fffefd; }.trend-card { margin-bottom: 22px; padding: 26px; }.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 21px; }.section-heading h2 { margin: 5px 0 0; font-size: 1.45rem; }.section-heading > span { color: #66736e; font-size: .9rem; font-weight: 700; }.weight-chart { height: 230px; display: grid; grid-template-columns: repeat(var(--entry-count), minmax(58px, 1fr)); gap: 11px; overflow-x: auto; }.weight-column { min-width: 58px; display: grid; grid-template-rows: 24px minmax(0, 1fr) 23px; gap: 7px; text-align: center; }.weight-column strong { color: #315e51; font-size: .82rem; }.weight-column small { color: #6b7772; font-size: .75rem; font-weight: 700; }.weight-track { position: relative; overflow: hidden; border-radius: 10px; background: #eff3f0; }.weight-track span { position: absolute; right: 0; bottom: 0; left: 0; border-radius: 10px 10px 5px 5px; background: linear-gradient(180deg, #cbed63, #779c2f); }
.content-grid { display: grid; grid-template-columns: minmax(320px, .8fr) minmax(0, 1.2fr); gap: 22px; align-items: start; }.content-card { padding: 26px; }.form-card form, .form-card label { display: grid; gap: 8px; }.form-card form { gap: 17px; }.form-card label { position: relative; color: #344b43; font-size: .92rem; font-weight: 750; }.form-card label > span { position: absolute; right: 12px; bottom: 14px; color: #718079; font-size: .78rem; }.form-card input, .form-card textarea { width: 100%; padding: 12px 13px; border: 1px solid #ccd8d1; border-radius: 11px; background: #fff; color: #172033; font: inherit; font-size: 1rem; }.form-card input:focus, .form-card textarea:focus { outline: 3px solid rgba(203, 237, 99, .35); border-color: #91ad43; }.measurement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }.form-actions { display: flex; justify-content: flex-end; gap: 9px; }.form-actions button, .history-actions button { padding: 10px 14px; border-radius: 10px; font: inherit; font-size: .9rem; font-weight: 800; cursor: pointer; }.primary-button { border: 1px solid #244c40; background: #244c40; color: #fff; }.secondary-button { border: 1px solid #cbd5cf; background: #fff; color: #52615d; }.form-actions button:disabled, .history-actions button:disabled { opacity: .55; cursor: wait; }
.history-list { display: grid; }.history-item { display: grid; grid-template-columns: 112px minmax(0, 1fr) auto; gap: 14px; align-items: start; padding: 17px 0; border-top: 1px solid #edf0ee; }.history-item time { color: #58665f; font-size: .9rem; font-weight: 750; }.history-values { min-width: 0; display: flex; flex-wrap: wrap; gap: 5px 12px; }.history-values strong { color: #173f34; font-size: 1.08rem; }.history-values span { color: #5e6c66; font-size: .9rem; }.history-values p { width: 100%; margin: 4px 0 0; color: #6c7873; font-size: .88rem; line-height: 1.45; overflow-wrap: anywhere; }.history-actions { display: flex; gap: 7px; }.history-actions button { padding: 8px 10px; border: 1px solid #cbd5cf; background: #fff; color: #52615d; }.history-actions .delete-button { border-color: #e5c1bb; color: #a23a30; }
.empty-state, .state-card { min-height: 190px; display: grid; place-items: center; align-content: center; color: #718079; text-align: center; }.state-card { padding: 30px; }.spinner { width: 34px; height: 34px; margin-bottom: 12px; border: 3px solid #e5e9ed; border-top-color: #89aa3d; border-radius: 50%; animation: spin .8s linear infinite; }@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1180px) { .summary-grid { grid-template-columns: repeat(2, 1fr); }.content-grid { grid-template-columns: 1fr; } }
@media (max-width: 1000px) { .app-shell { grid-template-columns: 1fr; }.sidebar { display: none; }.main-content { padding: 32px 24px 48px; } }
@media (max-width: 650px) { .main-content { padding: 24px 16px 40px; }.topbar { align-items: flex-start; }.topbar :deep(.profile) { display: none; }.summary-grid, .measurement-grid { grid-template-columns: 1fr; }.history-item { grid-template-columns: 1fr; }.history-actions { width: 100%; }.history-actions button { flex: 1; }.section-heading { flex-direction: column; }.summary-card { min-height: 145px; } }
</style>
