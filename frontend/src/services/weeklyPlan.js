import { getCurrentUser } from 'aws-amplify/auth'

const PLAN_UPDATED_EVENT = 'repvelta-weekly-plan-updated'

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
    createdAt: createdAt.toISOString(),
    startDate: days[0].date,
    endDate: days[6].date,
    days,
    rawText: String(text),
  }

  localStorage.setItem(await getStorageKey(), JSON.stringify(plan))
  window.dispatchEvent(new CustomEvent(PLAN_UPDATED_EVENT, { detail: plan }))

  return plan
}

export const loadWeeklyPlan = async () => {
  const savedPlan = localStorage.getItem(await getStorageKey())

  if (!savedPlan) return null

  try {
    const plan = JSON.parse(savedPlan)
    return Array.isArray(plan.days) ? plan : null
  } catch {
    return null
  }
}

export const getTodayPlanDay = (plan, date = new Date()) => {
  if (!plan?.days) return null
  return plan.days.find((day) => day.date === toLocalDate(date)) || null
}

export const weeklyPlanUpdatedEvent = PLAN_UPDATED_EVENT
