import { fetchAuthSession } from 'aws-amplify/auth'
import { loadCurrentProfilePreferences } from './profilePreferences'

const apiUrl = import.meta.env.VITE_AI_COACH_API_URL

const getConversationContext = (messages = []) =>
  messages
    .filter(
      (item) =>
        ['user', 'assistant'].includes(item?.role) &&
        typeof item?.content === 'string' &&
        item.content.trim(),
    )
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 2000),
      feedback:
        item.role === 'assistant' &&
        ['helpful', 'not-helpful'].includes(item.feedback)
        ? item.feedback
        : undefined,
      feedbackNote:
        item.role === 'assistant' && typeof item.feedbackNote === 'string'
          ? item.feedbackNote.trim().slice(0, 300)
          : undefined,
    }))

export const requestCoachReply = async (message, messages = []) => {
  if (!apiUrl) {
    throw new Error(
      'AI Coach is not connected yet. Add VITE_AI_COACH_API_URL to the frontend environment after the Lambda API is deployed.',
    )
  }

  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()

  if (!idToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const preferences = await loadCurrentProfilePreferences()
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      preferences,
      conversation: getConversationContext(messages),
    }),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'The AI Coach could not respond.')
  }

  return {
    reply: String(result.reply || ''),
    proposedAction:
      result.proposedAction?.type === 'update_profile_goals'
        ? result.proposedAction
        : undefined,
  }
}
