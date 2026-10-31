import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.WORKOUTS_TABLE || 'FitCloudWorkouts'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'OPTIONS,PUT',
  'Content-Type': 'application/json',
}

const response = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
})

const getUserId = (event) => {
  const claims =
    event.requestContext?.authorizer?.jwt?.claims ||
    event.requestContext?.authorizer?.claims ||
    {}

  return claims.sub || ''
}

const normalizeExercises = (exercises) => {
  if (!Array.isArray(exercises) || exercises.length < 1 || exercises.length > 50) {
    return null
  }

  const normalized = exercises.map((exercise) => ({
    muscleGroup: String(exercise?.muscleGroup || '').trim().toLowerCase(),
    exercise: String(exercise?.exercise || '').trim().slice(0, 100),
    sets: Number(exercise?.sets),
    reps: Number(exercise?.reps),
    weight: Number(exercise?.weight),
  }))

  const isValid = normalized.every(
    (exercise) =>
      exercise.muscleGroup &&
      exercise.exercise &&
      Number.isInteger(exercise.sets) &&
      exercise.sets >= 1 &&
      exercise.sets <= 100 &&
      Number.isInteger(exercise.reps) &&
      exercise.reps >= 1 &&
      exercise.reps <= 1000 &&
      Number.isFinite(exercise.weight) &&
      exercise.weight >= 0 &&
      exercise.weight <= 2000,
  )

  return isValid ? normalized : null
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod

  if (method === 'OPTIONS') return response(204, {})
  if (method !== 'PUT') return response(405, { message: 'Method not allowed.' })

  const userId = getUserId(event)

  if (!userId) return response(401, { message: 'Authentication is required.' })

  let body

  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return response(400, { message: 'The request body must be valid JSON.' })
  }

  const workoutId = String(body.workoutId || '').trim()
  const date = String(body.date || '').trim()
  const exercises = normalizeExercises(body.exercises)

  if (!workoutId) return response(400, { message: 'A workout ID is required.' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return response(400, { message: 'A valid workout date is required.' })
  }
  if (!exercises) {
    return response(400, { message: 'Please provide valid exercise details.' })
  }

  try {
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, workoutId },
        UpdateExpression: 'SET #date = :date, exercises = :exercises, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
          ':date': date,
          ':exercises': exercises,
          ':updatedAt': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(userId) AND attribute_exists(workoutId)',
        ReturnValues: 'ALL_NEW',
      }),
    )

    return response(200, result.Attributes)
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { message: 'Workout not found.' })
    }

    console.error('Update workout failed', error)
    return response(500, { message: 'The workout could not be updated.' })
  }
}
