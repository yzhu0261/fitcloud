import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.PLANS_TABLE_NAME
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PATCH,DELETE',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

const getMethod = (event) =>
  event.requestContext?.http?.method || event.httpMethod || ''

const getUserId = (event) => {
  const claims =
    event.requestContext?.authorizer?.jwt?.claims ||
    event.requestContext?.authorizer?.claims ||
    {}

  return claims.sub || ''
}

const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}')
  } catch {
    return null
  }
}

const validatePlan = (plan) => {
  if (!plan || !Array.isArray(plan.days) || plan.days.length !== 7) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(plan.startDate || ''))) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(plan.endDate || ''))) return false

  return plan.days.every(
    (day, index) =>
      Number(day.dayNumber) === index + 1 &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(day.date || '')) &&
      typeof day.details === 'string' &&
      day.details.trim().length > 0 &&
      day.details.length <= 1200,
  )
}

const getLatestPlan = async (userId) => {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: 1,
    }),
  )

  return result.Items?.[0] || null
}

const savePlan = async (userId, body) => {
  if (!validatePlan(body.plan)) {
    return response(400, { message: 'A complete and valid seven-day plan is required.' })
  }

  const createdAt = new Date().toISOString()
  const item = {
    userId,
    planId: createdAt,
    createdAt,
    startDate: body.plan.startDate,
    endDate: body.plan.endDate,
    rawText: String(body.plan.rawText || '').slice(0, 12000),
    days: body.plan.days.map((day) => ({
      dayNumber: Number(day.dayNumber),
      date: day.date,
      details: day.details.trim(),
      completed: Boolean(day.completed),
    })),
  }

  await documentClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(planId)',
    }),
  )

  return response(201, { plan: item })
}

const updateDay = async (userId, body) => {
  const dayNumber = Number(body.dayNumber)
  const dayIndex = dayNumber - 1

  if (!body.planId || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 7) {
    return response(400, { message: 'A valid plan and day number are required.' })
  }

  const result = await documentClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { userId, planId: body.planId },
      UpdateExpression: `SET #days[${dayIndex}].#completed = :completed, updatedAt = :updatedAt`,
      ConditionExpression: 'attribute_exists(userId) AND attribute_exists(planId)',
      ExpressionAttributeNames: {
        '#days': 'days',
        '#completed': 'completed',
      },
      ExpressionAttributeValues: {
        ':completed': Boolean(body.completed),
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }),
  )

  return response(200, { plan: result.Attributes })
}

const deletePlan = async (userId, event) => {
  const planId = event.queryStringParameters?.planId

  if (!planId) return response(400, { message: 'A plan ID is required.' })

  await documentClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { userId, planId },
      ConditionExpression: 'attribute_exists(userId) AND attribute_exists(planId)',
    }),
  )

  return response(204, {})
}

export const handler = async (event) => {
  const method = getMethod(event)

  if (method === 'OPTIONS') return response(204, {})
  if (!tableName) return response(500, { message: 'Plan storage is not configured.' })

  const userId = getUserId(event)
  if (!userId) return response(401, { message: 'Authentication is required.' })

  try {
    if (method === 'GET') {
      return response(200, { plan: await getLatestPlan(userId) })
    }

    const body = parseBody(event)
    if (!body && method !== 'DELETE') {
      return response(400, { message: 'The request body must be valid JSON.' })
    }

    if (method === 'POST') return await savePlan(userId, body)
    if (method === 'PATCH') return await updateDay(userId, body)
    if (method === 'DELETE') return await deletePlan(userId, event)

    return response(405, { message: 'Method not allowed.' })
  } catch (error) {
    console.error('Plans API error:', error)

    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { message: 'The requested plan was not found.' })
    }

    return response(500, { message: 'The weekly plan could not be processed.' })
  }
}
