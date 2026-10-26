import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

const apiUrl = import.meta.env.VITE_AI_COACH_API_URL

const getCoachPreferences = async () => {
  const user = await getCurrentUser()
  const savedProfile = localStorage.getItem(`repvelta-profile-${user.username}`)

  if (!savedProfile) {
    return {
      profileConfigured: false,
      weeklyWorkoutGoal: 3,
      dailyCalorieGoal: 2000,
    }
  }

  try {
    const profile = JSON.parse(savedProfile)

    return {
      profileConfigured: true,
      displayName: String(profile.displayName || '').trim().slice(0, 40),
      weeklyWorkoutGoal: Number(profile.weeklyWorkoutGoal) || 3,
      dailyCalorieGoal: Number(profile.dailyCalorieGoal) || 2000,
    }
  } catch {
    return {
      profileConfigured: false,
      weeklyWorkoutGoal: 3,
      dailyCalorieGoal: 2000,
    }
  }
}

export const requestCoachReply = async (message) => {
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

  const preferences = await getCoachPreferences()
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, preferences }),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'The AI Coach could not respond.')
  }

  return result.reply
}
