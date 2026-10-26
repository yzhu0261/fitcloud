import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

const PLAN_UPDATED_EVENT = 'repvelta-weekly-plan-updated'
const plansApiUrl = import.meta.env.VITE_PLANS_API_URL

const toLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getStorageKey = async () => {
  const user = await getCurrentUser()
  return `repvelta-weekly-plan-${user.username}`
}

const cachePlan = async (plan) => {
  const storageKey = await getStorageKey()

  if (plan) {
    localStorage.setItem(storageKey, JSON.stringify(plan))
  } else {
    localStorage.removeItem(storageKey)
  }

  window.dispatchEvent(new CustomEvent(PLAN_UPDATED_EVENT, { detail: plan }))
  return plan
}

const loadCachedPlan = async () => {
  const savedPlan = localStorage.getItem(await getStorageKey())

  if (!savedPlan) return null

  try {
    const plan = JSON.parse(savedPlan)
    return Array.isArray(plan.days) ? plan : null
  } catch {
    return null
  }
}

const requestPlansApi = async (options = {}, query = '') => {
  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()

  if (!idToken) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch(`${plansApiUrl}${query}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const result = response.status === 204 ? {} : await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'The weekly plan could not be processed.')
  }

  return result
}

export const parseWeeklyPlan = (text) => {
  const lines = String(text || '').split(/\r?\n/)
  const days = []
  let currentDay = null

  lines.forEach((line) => {
    const trimmedLine = line.trim()
    const match = trimmedLine.match(/^Day\s*([1-7])\s*(?::|[-–—])\s*(.+)$/i)

    if (match) {
      currentDay = {
        dayNumber: Number(match[1]),
        details: match[2].trim(),
      }
      days.push(currentDay)
      return
    }

    if (currentDay && trimmedLine) {
      currentDay.details = `${currentDay.details} ${trimmedLine}`
    }
  })

  if (days.length !== 7 || new Set(days.map((day) => day.dayNumber)).size !== 7) {
    return null
  }

  return days.sort((a, b) => a.dayNumber - b.dayNumber)
}

export const saveWeeklyPlan = async (text) => {
  const parsedDays = parseWeeklyPlan(text)

  if (!parsedDays) {
    throw new Error('This reply does not contain a complete seven-day plan.')
  }

  const createdAt = new Date()
  const days = parsedDays.map((day, index) => {
    const date = new Date(createdAt)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + index)

    return {
      ...day,
      date: toLocalDate(date),
    }
  })
  const plan = {
    planId: createdAt.toISOString(),
    createdAt: createdAt.toISOString(),
    startDate: days[0].date,
    endDate: days[6].date,
    days,
    rawText: String(text),
  }

  if (plansApiUrl) {
    const result = await requestPlansApi({
      method: 'POST',
      body: JSON.stringify({ plan }),
    })
    return cachePlan(result.plan)
  }

  return cachePlan(plan)
}

export const loadWeeklyPlan = async () => {
  if (plansApiUrl) {
    try {
      const result = await requestPlansApi({ method: 'GET' })

      if (result.plan) return cachePlan(result.plan)

      const cachedPlan = await loadCachedPlan()
      if (!cachedPlan) return cachePlan(null)

      const plan = {
        ...cachedPlan,
        planId: cachedPlan.planId || cachedPlan.createdAt || new Date().toISOString(),
      }
      const migrated = await requestPlansApi({
        method: 'POST',
        body: JSON.stringify({ plan }),
      })

      return cachePlan(migrated.plan)
    } catch (error) {
      console.warn('Using the locally cached weekly plan:', error)
    }
  }

  return loadCachedPlan()
}

export const updateWeeklyPlanDay = async (plan, dayNumber, completed) => {
  if (!plan?.planId) throw new Error('The saved weekly plan is missing its ID.')

  if (plansApiUrl) {
    const result = await requestPlansApi({
      method: 'PATCH',
      body: JSON.stringify({ planId: plan.planId, dayNumber, completed }),
    })
    return cachePlan(result.plan)
  }

  const updatedPlan = {
    ...plan,
    days: plan.days.map((day) =>
      day.dayNumber === dayNumber ? { ...day, completed } : day,
    ),
  }

  return cachePlan(updatedPlan)
}

export const deleteWeeklyPlan = async (plan) => {
  if (plansApiUrl && plan?.planId) {
    await requestPlansApi({
      method: 'DELETE',
      headers: {},
    }, `?planId=${encodeURIComponent(plan.planId)}`)
  }

  return cachePlan(null)
}

export const getTodayPlanDay = (plan, date = new Date()) => {
  if (!plan?.days) return null
  return plan.days.find((day) => day.date === toLocalDate(date)) || null
}

export const weeklyPlanUpdatedEvent = PLAN_UPDATED_EVENT
