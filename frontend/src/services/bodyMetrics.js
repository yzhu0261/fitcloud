import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

const apiUrl = import.meta.env.VITE_BODY_METRICS_API_URL
const storagePrefix = 'repvelta-body-metrics'
const goalStoragePrefix = 'repvelta-body-goal'

const getStorageKey = async () => {
  const user = await getCurrentUser()
  return `${storagePrefix}-${user.userId || user.username}`
}

const getGoalStorageKey = async () => {
  const user = await getCurrentUser()
  return `${goalStoragePrefix}-${user.userId || user.username}`
}

const loadLocalMetrics = async () => {
  try {
    return JSON.parse(localStorage.getItem(await getStorageKey()) || '[]')
  } catch {
    return []
  }
}

const saveLocalMetrics = async (metrics) => {
  localStorage.setItem(await getStorageKey(), JSON.stringify(metrics))
  return metrics
}

const requestApi = async (options = {}, query = '') => {
  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()

  if (!idToken) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch(`${apiUrl}${query}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const result = response.status === 204 ? {} : await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Body measurements could not be processed.')
  }

  return result
}

export const loadBodyMetrics = async () => {
  if (!apiUrl) return loadLocalMetrics()

  const result = await requestApi({ method: 'GET' })
  return result.metrics || []
}

export const loadBodyProgress = async () => {
  if (!apiUrl) {
    const targetWeightKg = Number(localStorage.getItem(await getGoalStorageKey()))
    return {
      metrics: await loadLocalMetrics(),
      goal: { targetWeightKg: Number.isFinite(targetWeightKg) && targetWeightKg > 0 ? targetWeightKg : null },
    }
  }

  const result = await requestApi({ method: 'GET' })
  return {
    metrics: result.metrics || [],
    goal: result.goal || { targetWeightKg: null },
  }
}

export const saveBodyGoal = async (targetWeightKg) => {
  if (apiUrl) {
    const result = await requestApi({
      method: 'PATCH',
      body: JSON.stringify({ targetWeightKg }),
    })
    return result.goal
  }

  localStorage.setItem(await getGoalStorageKey(), String(targetWeightKg))
  return { targetWeightKg }
}

export const createBodyMetric = async (metric) => {
  if (apiUrl) return requestApi({ method: 'POST', body: JSON.stringify(metric) })

  const metrics = await loadLocalMetrics()
  const createdMetric = {
    ...metric,
    metricId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
  }

  await saveLocalMetrics([...metrics, createdMetric])
  return createdMetric
}

export const updateBodyMetric = async (metric) => {
  if (apiUrl) return requestApi({ method: 'PUT', body: JSON.stringify(metric) })

  const metrics = await loadLocalMetrics()
  const updatedMetric = { ...metric, updatedAt: new Date().toISOString() }

  await saveLocalMetrics(
    metrics.map((item) => (item.metricId === metric.metricId ? updatedMetric : item)),
  )
  return updatedMetric
}

export const deleteBodyMetric = async (metricId) => {
  if (apiUrl) {
    return requestApi(
      { method: 'DELETE' },
      `?metricId=${encodeURIComponent(metricId)}`,
    )
  }

  const metrics = await loadLocalMetrics()
  await saveLocalMetrics(metrics.filter((item) => item.metricId !== metricId))
  return { deleted: true, metricId }
}

export const clearCurrentUserBodyMetrics = async () => {
  localStorage.removeItem(await getStorageKey())
  localStorage.removeItem(await getGoalStorageKey())
}
