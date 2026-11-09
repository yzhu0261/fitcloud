import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.PROFILES_TABLE || 'RepVeltaProfiles'
const userDataTables = [
  {
    tableName: process.env.WORKOUTS_TABLE || 'FitCloudWorkouts',
    sortKey: 'workoutId',
  },
  {
    tableName: process.env.NUTRITION_TABLE || 'FitCloudNutrition',
    sortKey: 'nutritionId',
  },
  {
    tableName: process.env.PLANS_TABLE_NAME || 'RepVeltaPlans',
    sortKey: 'planId',
  },
  {
    tableName: process.env.BODY_METRICS_TABLE || 'RepVeltaBodyMetrics',
    sortKey: 'metricId',
  },
]

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET,PUT',
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

const chunk = (items, size) => {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

const deleteBatch = async (table, requests) => {
  let pending = requests

  for (let attempt = 0; pending.length && attempt < 5; attempt += 1) {
    const result = await dynamo.send(
      new BatchWriteCommand({ RequestItems: { [table]: pending } }),
    )

    pending = result.UnprocessedItems?.[table] || []
  }

  if (pending.length) {
    throw new Error('Some records in ' + table + ' could not be deleted.')
  }
}

const deleteUserTableItems = async (userId, table, sortKey) => {
  let lastEvaluatedKey

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: table,
        KeyConditionExpression: '#userId = :userId',
        ExpressionAttributeNames: {
          '#userId': 'userId',
          '#sortKey': sortKey,
        },
        ExpressionAttributeValues: { ':userId': userId },
        ProjectionExpression: '#userId, #sortKey',
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    )

    const requests = (result.Items || []).map((item) => ({
      DeleteRequest: {
        Key: { userId: item.userId, [sortKey]: item[sortKey] },
      },
    }))

    for (const batch of chunk(requests, 25)) {
      await deleteBatch(table, batch)
    }

    lastEvaluatedKey = result.LastEvaluatedKey
  } while (lastEvaluatedKey)
}

const normalizeProfile = (body) => {
  const displayName = String(body?.displayName || '').trim().slice(0, 40)
  const weeklyWorkoutGoal = Number(body?.weeklyWorkoutGoal)
  const dailyCalorieGoal = Number(body?.dailyCalorieGoal)

  if (
    !Number.isInteger(weeklyWorkoutGoal) ||
    weeklyWorkoutGoal < 1 ||
    weeklyWorkoutGoal > 14 ||
    !Number.isInteger(dailyCalorieGoal) ||
    dailyCalorieGoal < 500 ||
    dailyCalorieGoal > 10000
  ) {
    return null
  }

  return { displayName, weeklyWorkoutGoal, dailyCalorieGoal }
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || ''

  if (method === 'OPTIONS') return response(204, {})

  const userId = getUserId(event)
  if (!userId) return response(401, { message: 'Authentication is required.' })

  try {
    if (method === 'GET') {
      const result = await dynamo.send(
        new GetCommand({ TableName: tableName, Key: { userId } }),
      )

      return response(200, { profile: result.Item || null })
    }

    if (method === 'PUT') {
      let body

      try {
        body = JSON.parse(event.body || '{}')
      } catch {
        return response(400, { message: 'The request body must be valid JSON.' })
      }

      const profile = normalizeProfile(body)
      if (!profile) {
        return response(400, { message: 'Please provide valid profile goals.' })
      }

      const result = await dynamo.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { userId },
          UpdateExpression:
            'SET displayName = :displayName, weeklyWorkoutGoal = :weeklyWorkoutGoal, dailyCalorieGoal = :dailyCalorieGoal, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':displayName': profile.displayName,
            ':weeklyWorkoutGoal': profile.weeklyWorkoutGoal,
            ':dailyCalorieGoal': profile.dailyCalorieGoal,
            ':updatedAt': new Date().toISOString(),
          },
          ReturnValues: 'ALL_NEW',
        }),
      )

      return response(200, { profile: result.Attributes })
    }

    if (method === 'DELETE') {
      await Promise.all(
        userDataTables.map(({ tableName: userTable, sortKey }) =>
          deleteUserTableItems(userId, userTable, sortKey),
        ),
      )

      await dynamo.send(
        new DeleteCommand({ TableName: tableName, Key: { userId } }),
      )

      return response(200, {
        deleted: true,
        resources: ['profile', 'workouts', 'nutrition', 'plans', 'bodyMetrics'],
      })
    }

    return response(405, { message: 'Method not allowed.' })
  } catch (error) {
    console.error('Profile API failed', error)
    return response(500, { message: 'Your profile could not be processed.' })
  }
}
