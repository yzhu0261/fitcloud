import { getCurrentUser } from 'aws-amplify/auth'

const storageKey = async () => {
  const user = await getCurrentUser()
  return `repvelta-coach-conversation-${user.username}`
}

const normalizeProposedAction = (action) => {
  const weeklyWorkoutGoal = Number(action?.weeklyWorkoutGoal)
  const dailyCalorieGoal = Number(action?.dailyCalorieGoal)

  if (
    action?.type !== 'update_profile_goals' ||
    !Number.isInteger(weeklyWorkoutGoal) ||
    weeklyWorkoutGoal < 1 ||
    weeklyWorkoutGoal > 14 ||
    !Number.isInteger(dailyCalorieGoal) ||
    dailyCalorieGoal < 500 ||
    dailyCalorieGoal > 10000
  ) {
    return undefined
  }

  return {
    type: 'update_profile_goals',
    weeklyWorkoutGoal,
    dailyCalorieGoal,
    reason: String(action.reason || '').trim().slice(0, 300),
  }
}

const normalizeGoalSnapshot = (goals) => {
  const weeklyWorkoutGoal = Number(goals?.weeklyWorkoutGoal)
  const dailyCalorieGoal = Number(goals?.dailyCalorieGoal)

  if (
    !Number.isInteger(weeklyWorkoutGoal) ||
    weeklyWorkoutGoal < 1 ||
    weeklyWorkoutGoal > 14 ||
    !Number.isInteger(dailyCalorieGoal) ||
    dailyCalorieGoal < 500 ||
    dailyCalorieGoal > 10000
  ) {
    return undefined
  }

  return { weeklyWorkoutGoal, dailyCalorieGoal }
}

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return []

  return messages
    .filter(
      (message) =>
        ['user', 'assistant'].includes(message?.role) &&
        typeof message?.content === 'string' &&
        message.content.trim(),
    )
    .slice(-20)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4000),
      isWeeklyPlan: message.isWeeklyPlan === true,
      feedback:
        message.role === 'assistant' &&
        ['helpful', 'not-helpful'].includes(message.feedback)
        ? message.feedback
        : undefined,
      feedbackNote:
        message.role === 'assistant' &&
        typeof message.feedbackNote === 'string'
          ? message.feedbackNote.trim().slice(0, 300)
          : undefined,
      proposedAction:
        message.role === 'assistant'
          ? normalizeProposedAction(message.proposedAction)
          : undefined,
      actionStatus:
        message.role === 'assistant' &&
        ['applied', 'discarded', 'reverted'].includes(message.actionStatus)
          ? message.actionStatus
          : undefined,
      previousGoals:
        message.role === 'assistant'
          ? normalizeGoalSnapshot(message.previousGoals)
          : undefined,
      actionUpdatedAt:
        message.role === 'assistant' &&
        typeof message.actionUpdatedAt === 'string' &&
        !Number.isNaN(Date.parse(message.actionUpdatedAt))
          ? message.actionUpdatedAt
          : undefined,
    }))
}

export const loadCoachConversation = async () => {
  try {
    const savedConversation = localStorage.getItem(await storageKey())
    return savedConversation
      ? normalizeMessages(JSON.parse(savedConversation))
      : []
  } catch {
    return []
  }
}

export const saveCoachConversation = async (messages) => {
  try {
    localStorage.setItem(
      await storageKey(),
      JSON.stringify(normalizeMessages(messages)),
    )
  } catch {
    // Chat persistence should never prevent the coach from responding.
  }
}

export const clearCoachConversation = async () => {
  try {
    localStorage.removeItem(await storageKey())
  } catch {
    // The visible conversation can still be cleared when storage is unavailable.
  }
}
