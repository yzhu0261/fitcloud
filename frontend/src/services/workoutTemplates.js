import { getCurrentUser } from 'aws-amplify/auth'

const TEMPLATE_PREFIX = 'repvelta.workout-templates'
const MAX_TEMPLATES = 8

const getStorage = () => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const getWorkoutTemplateKey = async () => {
  const user = await getCurrentUser()
  const userId = user.userId || user.username

  if (!userId) throw new Error('The signed-in user could not be identified.')
  return `${TEMPLATE_PREFIX}:${userId}`
}

const normaliseTemplate = (template) => ({
  id: String(template.id || `custom-${Date.now()}`),
  title: String(template.title || '').trim().slice(0, 40),
  description: String(template.description || '').trim().slice(0, 100),
  exercises: Array.isArray(template.exercises)
    ? template.exercises
        .filter((item) => String(item.exercise || '').trim())
        .map((item) => ({
          muscleGroup: String(item.muscleGroup || 'other').trim().toLowerCase(),
          exercise: String(item.exercise || '').trim().slice(0, 80),
          sets: Math.max(1, Number(item.sets) || 1),
          reps: Math.max(1, Number(item.reps) || 1),
          weight: Math.max(0, Number(item.weight) || 0),
        }))
    : [],
})

export const loadWorkoutTemplates = (key) => {
  const storage = getStorage()

  if (!storage || !key) return []

  try {
    const templates = JSON.parse(storage.getItem(key) || '[]')

    if (!Array.isArray(templates)) return []
    return templates
      .map(normaliseTemplate)
      .filter((template) => template.title && template.exercises.length)
      .slice(0, MAX_TEMPLATES)
  } catch {
    storage.removeItem(key)
    return []
  }
}

export const saveWorkoutTemplates = (key, templates) => {
  const storage = getStorage()

  if (!storage || !key) return []

  const savedTemplates = templates
    .map(normaliseTemplate)
    .filter((template) => template.title && template.exercises.length)
    .slice(0, MAX_TEMPLATES)

  storage.setItem(key, JSON.stringify(savedTemplates))
  return savedTemplates
}

export const clearCurrentUserWorkoutTemplates = async () => {
  const storage = getStorage()

  if (!storage) return
  storage.removeItem(await getWorkoutTemplateKey())
}
