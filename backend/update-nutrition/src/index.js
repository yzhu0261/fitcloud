import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.NUTRITION_TABLE || 'FitCloudNutrition'

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
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

const normalizeFoods = (foods) => {
  if (!Array.isArray(foods) || foods.length < 1 || foods.length > 100) return null

  const normalized = foods.map((food) => ({
    foodName: String(food?.foodName || '').trim().slice(0, 120),
    calories: Number(food?.calories),
    protein: Number(food?.protein),
    carbs: Number(food?.carbs),
    fat: Number(food?.fat),
  }))

  const isValid = normalized.every(
    (food) =>
      food.foodName &&
      Number.isFinite(food.calories) &&
      food.calories >= 0 &&
      food.calories <= 10000 &&
      Number.isFinite(food.protein) &&
      food.protein >= 0 &&
      food.protein <= 1000 &&
      Number.isFinite(food.carbs) &&
      food.carbs >= 0 &&
      food.carbs <= 2000 &&
      Number.isFinite(food.fat) &&
      food.fat >= 0 &&
      food.fat <= 1000,
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

  const nutritionId = String(body.nutritionId || '').trim()
  const date = String(body.date || '').trim()
  const foods = normalizeFoods(body.foods)

  if (!nutritionId) return response(400, { message: 'A nutrition ID is required.' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return response(400, { message: 'A valid nutrition date is required.' })
  }
  if (!foods) {
    return response(400, { message: 'Please provide valid food details.' })
  }

  try {
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, nutritionId },
        UpdateExpression: 'SET #date = :date, foods = :foods, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
          ':date': date,
          ':foods': foods,
          ':updatedAt': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(userId) AND attribute_exists(nutritionId)',
        ReturnValues: 'ALL_NEW',
      }),
    )

    return response(200, result.Attributes)
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { message: 'Nutrition record not found.' })
    }

    console.error('Update nutrition failed', error)
    return response(500, { message: 'The nutrition record could not be updated.' })
  }
}
