import { getCurrentUser } from 'aws-amplify/auth'

const DRAFT_PREFIX = 'repvelta.activity-draft'
const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

const getStorage = () => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const getActivityDraftKey = async (activity) => {
  const user = await getCurrentUser()
  const userId = user.userId || user.username

  if (!userId) throw new Error('The signed-in user could not be identified.')

  return `${DRAFT_PREFIX}:${userId}:${activity}`
}

export const loadActivityDraft = (key) => {
  const storage = getStorage()

  if (!storage || !key) return null

  try {
    const draft = JSON.parse(storage.getItem(key) || 'null')
    const savedAt = Number(draft?.savedAt)

    if (!draft || !Number.isFinite(savedAt) || Date.now() - savedAt > DRAFT_MAX_AGE_MS) {
      storage.removeItem(key)
      return null
    }

    return draft.data ?? null
  } catch {
    storage.removeItem(key)
    return null
  }
}

export const saveActivityDraft = (key, data) => {
  const storage = getStorage()

  if (!storage || !key) return false

  try {
    storage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }))
    return true
  } catch {
    return false
  }
}

export const clearActivityDraft = (key) => {
  const storage = getStorage()

  if (!storage || !key) return
  storage.removeItem(key)
}

export const clearCurrentUserActivityDrafts = async () => {
  const storage = getStorage()

  if (!storage) return

  const user = await getCurrentUser()
  const userId = user.userId || user.username

  if (!userId) return

  storage.removeItem(`${DRAFT_PREFIX}:${userId}:workout`)
  storage.removeItem(`${DRAFT_PREFIX}:${userId}:nutrition`)
}
