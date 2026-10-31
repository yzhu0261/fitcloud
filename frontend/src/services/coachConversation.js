import { getCurrentUser } from 'aws-amplify/auth'

const storageKey = async () => {
  const user = await getCurrentUser()
  return `repvelta-coach-conversation-${user.username}`
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
      feedback: ['helpful', 'not-helpful'].includes(message.feedback)
        ? message.feedback
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
