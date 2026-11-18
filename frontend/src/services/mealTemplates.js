import { getCurrentUser } from 'aws-amplify/auth'

const TEMPLATE_PREFIX = 'repvelta.meal-templates'
const MAX_TEMPLATES = 8

const getStorage = () => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const getMealTemplateKey = async () => {
  const user = await getCurrentUser()
  const userId = user.userId || user.username

  if (!userId) throw new Error('The signed-in user could not be identified.')
  return `${TEMPLATE_PREFIX}:${userId}`
}

const normaliseFood = (food) => ({
  foodName: String(food.foodName || '').trim().slice(0, 100),
  calories: Math.max(0, Number(food.calories) || 0),
  protein: Math.max(0, Number(food.protein) || 0),
  carbs: Math.max(0, Number(food.carbs) || 0),
  fat: Math.max(0, Number(food.fat) || 0),
})

const normaliseTemplate = (template) => ({
  id: String(template.id || `meal-${Date.now()}`),
  title: String(template.title || '').trim().slice(0, 40),
  foods: Array.isArray(template.foods)
    ? template.foods.map(normaliseFood).filter((food) => food.foodName)
    : [],
})

export const loadMealTemplates = (key) => {
  const storage = getStorage()

  if (!storage || !key) return []

  try {
    const templates = JSON.parse(storage.getItem(key) || '[]')

    if (!Array.isArray(templates)) return []
    return templates
      .map(normaliseTemplate)
      .filter((template) => template.title && template.foods.length)
      .slice(0, MAX_TEMPLATES)
  } catch {
    storage.removeItem(key)
    return []
  }
}

export const saveMealTemplates = (key, templates) => {
  const storage = getStorage()

  if (!storage || !key) return []

  const savedTemplates = templates
    .map(normaliseTemplate)
    .filter((template) => template.title && template.foods.length)
    .slice(0, MAX_TEMPLATES)

  storage.setItem(key, JSON.stringify(savedTemplates))
  return savedTemplates
}

export const clearCurrentUserMealTemplates = async () => {
  const storage = getStorage()

  if (!storage) return
  storage.removeItem(await getMealTemplateKey())
}
