import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const tableName = process.env.WORKOUTS_TABLE || 'FitCloudWorkouts'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
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

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod

  if (method === 'OPTIONS') return response(204, {})
  if (method !== 'DELETE') return response(405, { message: 'Method not allowed.' })

  const userId = getUserId(event)
  const workoutId = event.queryStringParameters?.workoutId?.trim()

  if (!userId) return response(401, { message: 'Authentication is required.' })
  if (!workoutId) return response(400, { message: 'A workout ID is required.' })

  try {
    await dynamo.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { userId, workoutId },
        ConditionExpression: 'attribute_exists(userId) AND attribute_exists(workoutId)',
      }),
    )

    return response(200, { workoutId })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { message: 'Workout not found.' })
    }

    console.error('Delete workout failed', error)
    return response(500, { message: 'The workout could not be deleted.' })
  }
}
