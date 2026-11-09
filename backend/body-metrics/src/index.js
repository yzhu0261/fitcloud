import { randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.BODY_METRICS_TABLE || 'RepVeltaBodyMetrics'

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET,POST,PUT',
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

const optionalNumber = (value, minimum, maximum) => {
  if (value === '' || value === null || value === undefined) return null

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : NaN
}

const normalizeMetric = (body) => {
  const date = String(body?.date || '').trim()
  const weightKg = optionalNumber(body?.weightKg, 20, 500)
  const bodyFatPercent = optionalNumber(body?.bodyFatPercent, 1, 75)
  const waistCm = optionalNumber(body?.waistCm, 30, 300)
  const note = String(body?.note || '').trim().slice(0, 300)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  if ([weightKg, bodyFatPercent, waistCm].some(Number.isNaN)) return null
  if (weightKg === null && bodyFatPercent === null && waistCm === null) return null

  return { date, weightKg, bodyFatPercent, waistCm, note }
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || ''

  if (method === 'OPTIONS') return response(204, {})

  const userId = getUserId(event)
  if (!userId) return response(401, { message: 'Authentication is required.' })

  try {
    if (method === 'GET') {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
        }),
      )

      return response(200, { metrics: result.Items || [] })
    }

    if (method === 'POST') {
      const metric = normalizeMetric(JSON.parse(event.body || '{}'))
      if (!metric) return response(400, { message: 'Please provide valid body measurements.' })

      const item = {
        userId,
        metricId: randomUUID(),
        ...metric,
        createdAt: new Date().toISOString(),
      }

      await dynamo.send(new PutCommand({ TableName: tableName, Item: item }))
      return response(201, item)
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}')
      const metricId = String(body.metricId || '').trim()
      const metric = normalizeMetric(body)

      if (!metricId || !metric) {
        return response(400, { message: 'Please provide a valid measurement record.' })
      }

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { userId, metricId },
          UpdateExpression:
            'SET #date = :date, weightKg = :weightKg, bodyFatPercent = :bodyFatPercent, waistCm = :waistCm, note = :note, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#date': 'date' },
          ExpressionAttributeValues: {
            ':date': metric.date,
            ':weightKg': metric.weightKg,
            ':bodyFatPercent': metric.bodyFatPercent,
            ':waistCm': metric.waistCm,
            ':note': metric.note,
            ':updatedAt': new Date().toISOString(),
          },
          ConditionExpression: 'attribute_exists(userId) AND attribute_exists(metricId)',
          ReturnValues: 'ALL_NEW',
        }),
      )

      return response(200, result.Attributes)
    }

    if (method === 'DELETE') {
      const metricId = String(event.queryStringParameters?.metricId || '').trim()
      if (!metricId) return response(400, { message: 'A measurement ID is required.' })

      await dynamo.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { userId, metricId },
          ConditionExpression: 'attribute_exists(userId) AND attribute_exists(metricId)',
        }),
      )

      return response(200, { deleted: true, metricId })
    }

    return response(405, { message: 'Method not allowed.' })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { message: 'Measurement record not found.' })
    }

    if (error instanceof SyntaxError) {
      return response(400, { message: 'The request body must be valid JSON.' })
    }

    console.error('Body metrics API failed', error)
    return response(500, { message: 'Body measurements could not be processed.' })
  }
}
