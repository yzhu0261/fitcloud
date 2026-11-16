import { getCurrentUser } from 'aws-amplify/auth'

const HYDRATION_PREFIX = 'repvelta:hydration'

export const hydrationUpdatedEvent = 'repvelta:hydration-updated'

const normaliseHydration = (value = {}) => {
  const intake = Number(value.intakeMl)
  const goal = Number(value.goalMl)

  return {
    intakeMl: Number.isFinite(intake) && intake >= 0 && intake <= 20000 ? intake : 0,
    goalMl: Number.isFinite(goal) && goal >= 500 && goal <= 10000 ? goal : 2000,
  }
}

export const getHydrationStorageKey = (username, date) => {
  if (!username || !date) return ''
  return `${HYDRATION_PREFIX}:${username}:${date}`
}

export const loadHydration = (username, date) => {
  const key = getHydrationStorageKey(username, date)

  if (!key) return normaliseHydration()

  try {
    return normaliseHydration(JSON.parse(localStorage.getItem(key) || 'null'))
  } catch {
    localStorage.removeItem(key)
    return normaliseHydration()
  }
}

export const loadHydrationHistory = (username) => {
  if (!username) return []

  const keyPrefix = `${HYDRATION_PREFIX}:${username}:`
  const records = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)

    if (!key?.startsWith(keyPrefix)) continue

    const date = key.slice(keyPrefix.length)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    records.push({ date, ...loadHydration(username, date) })
  }

  return records.sort((a, b) => a.date.localeCompare(b.date))
}

export const saveHydration = (username, date, hydration) => {
  const key = getHydrationStorageKey(username, date)
  const savedHydration = normaliseHydration(hydration)

  if (!key) return savedHydration

  localStorage.setItem(key, JSON.stringify(savedHydration))
  window.dispatchEvent(
    new CustomEvent(hydrationUpdatedEvent, {
      detail: { username, date, ...savedHydration },
    }),
  )

  return savedHydration
}

export const clearCurrentUserHydration = async () => {
  const user = await getCurrentUser()
  const keyPrefix = `${HYDRATION_PREFIX}:${user.username}:`
  const keysToRemove = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(keyPrefix)) keysToRemove.push(key)
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
