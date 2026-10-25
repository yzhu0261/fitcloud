import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { Agent, run, tool } from '@openai/agents'
import { z } from 'zod'

const secretsClient = new SecretsManagerClient({})
const fitnessApiBaseUrl = process.env.FITNESS_API_BASE_URL
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'

let apiKeyReady = false

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

const getAuthorizationHeader = (event) => {
  const headers = event.headers || {}
  return headers.authorization || headers.Authorization || ''
}

const ensureOpenAiApiKey = async () => {
  if (apiKeyReady || process.env.OPENAI_API_KEY) {
    apiKeyReady = true
    return
  }

  const secretId = process.env.OPENAI_API_KEY_SECRET_ARN

  if (!secretId) {
    throw new Error('OPENAI_API_KEY_SECRET_ARN is not configured.')
  }

  const secret = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  )

  if (!secret.SecretString) {
    throw new Error('The OpenAI API key secret is empty.')
  }

  let apiKey = secret.SecretString

  try {
    const parsedSecret = JSON.parse(secret.SecretString)
    apiKey = parsedSecret.OPENAI_API_KEY || parsedSecret.apiKey || secret.SecretString
  } catch {
    // The secret may contain the API key as plain text.
  }

  process.env.OPENAI_API_KEY = apiKey
  apiKeyReady = true
}

const fetchFitnessData = async (path, authorization) => {
  if (!fitnessApiBaseUrl) {
    throw new Error('FITNESS_API_BASE_URL is not configured.')
  }

  const apiResponse = await fetch(`${fitnessApiBaseUrl}${path}`, {
    headers: { Authorization: authorization },
  })

  if (!apiResponse.ok) {
    throw new Error(`Fitness data request failed with status ${apiResponse.status}.`)
  }

  const data = await apiResponse.json()
  return Array.isArray(data) ? data : []
}

const sortNewestFirst = (records) =>
  [...records].sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || '')),
  )

const createCoachAgent = (authorization) => {
  const getRecentWorkouts = tool({
    name: 'get_recent_workouts',
    description:
      'Return the authenticated user’s ten most recent saved workouts.',
    parameters: z.object({}),
    async execute() {
      const workouts = await fetchFitnessData('/workouts', authorization)
      return JSON.stringify(sortNewestFirst(workouts).slice(0, 10))
    },
  })

  const getRecentNutrition = tool({
    name: 'get_recent_nutrition',
    description:
      'Return the authenticated user’s ten most recent nutrition records.',
    parameters: z.object({}),
    async execute() {
      const nutrition = await fetchFitnessData('/nutrition', authorization)
      return JSON.stringify(sortNewestFirst(nutrition).slice(0, 10))
    },
  })

  const calculateWeeklyProgress = tool({
    name: 'calculate_weekly_progress',
    description:
      'Calculate a seven-day summary of workouts, exercises, training volume, calories, and protein for the authenticated user.',
    parameters: z.object({}),
    async execute() {
      const [workouts, nutrition] = await Promise.all([
        fetchFitnessData('/workouts', authorization),
        fetchFitnessData('/nutrition', authorization),
      ])

      const today = new Date()
      const cutoff = new Date(today)
      cutoff.setUTCDate(cutoff.getUTCDate() - 6)
      cutoff.setUTCHours(0, 0, 0, 0)

      const isWithinSevenDays = (date) => {
        const parsedDate = new Date(`${date}T00:00:00Z`)
        return !Number.isNaN(parsedDate.getTime()) && parsedDate >= cutoff
      }

      const recentWorkouts = workouts.filter((item) => isWithinSevenDays(item.date))
      const recentNutrition = nutrition.filter((item) => isWithinSevenDays(item.date))

      const workoutSummary = recentWorkouts.reduce(
        (summary, workout) => {
          const exercises = Array.isArray(workout.exercises) ? workout.exercises : []
          summary.exercises += exercises.length
          summary.volume += exercises.reduce(
            (total, exercise) =>
              total +
              Number(exercise.sets || 0) *
                Number(exercise.reps || 0) *
                Number(exercise.weight || 0),
            0,
          )
          return summary
        },
        { workouts: recentWorkouts.length, exercises: 0, volume: 0 },
      )

      const nutritionSummary = recentNutrition.reduce(
        (summary, record) => {
          const foods = Array.isArray(record.foods) ? record.foods : []
          summary.calories += foods.reduce(
            (total, food) => total + Number(food.calories || 0),
            0,
          )
          summary.protein += foods.reduce(
            (total, food) => total + Number(food.protein || 0),
            0,
          )
          return summary
        },
        { recordedDays: recentNutrition.length, calories: 0, protein: 0 },
      )

      return JSON.stringify({
        period: 'Last 7 days including today',
        training: workoutSummary,
        nutrition: nutritionSummary,
      })
    },
  })

  return new Agent({
    name: 'RepVelta Fitness Coach',
    model: process.env.OPENAI_MODEL || 'gpt-6-luna',
    instructions: `
You are RepVelta's supportive fitness and nutrition coach.
Use the available tools whenever the user asks about their saved activity.
Base personalised observations only on tool results; never invent records.
Be concise, practical, encouraging, and clear about uncertainty.
Do not diagnose medical conditions or replace a doctor, physiotherapist, or dietitian.
If the user describes pain, injury, disordered eating, or an emergency, recommend qualified professional help.
This first version is read-only. Never claim that you changed, created, or deleted user data.
    `.trim(),
    tools: [getRecentWorkouts, getRecentNutrition, calculateWeeklyProgress],
  })
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return response(204, {})
  }

  const authorization = getAuthorizationHeader(event)

  if (!authorization) {
    return response(401, { message: 'Authentication is required.' })
  }

  let body

  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return response(400, { message: 'The request body must be valid JSON.' })
  }

  const message = String(body.message || '').trim()

  if (!message) {
    return response(400, { message: 'Please enter a message.' })
  }

  if (message.length > 2000) {
    return response(400, { message: 'Messages must be 2,000 characters or fewer.' })
  }

  try {
    await ensureOpenAiApiKey()
    const agent = createCoachAgent(authorization)
    const result = await run(agent, message)

    return response(200, {
      reply: result.finalOutput,
      agent: 'RepVelta Fitness Coach',
    })
  } catch (error) {
    console.error('AI Coach error:', error)
    return response(500, {
      message: 'The AI Coach is temporarily unavailable. Please try again.',
    })
  }
}
