import { getCurrentUser } from 'aws-amplify/auth'

const DEFAULT_PROFILE = Object.freeze({
  profileConfigured: false,
  displayName: '',
  weeklyWorkoutGoal: 3,
  dailyCalorieGoal: 2000,
})

const storageKey = (username) => `repvelta-profile-${username || 'member'}`

const normalizeProfile = (profile, profileConfigured = true) => {
  const weeklyWorkoutGoal = Number(profile?.weeklyWorkoutGoal)
  const dailyCalorieGoal = Number(profile?.dailyCalorieGoal)

  return {
    profileConfigured,
    displayName: String(profile?.displayName || '').trim().slice(0, 40),
    weeklyWorkoutGoal:
      Number.isInteger(weeklyWorkoutGoal) &&
      weeklyWorkoutGoal >= 1 &&
      weeklyWorkoutGoal <= 14
        ? weeklyWorkoutGoal
        : DEFAULT_PROFILE.weeklyWorkoutGoal,
    dailyCalorieGoal:
      Number.isInteger(dailyCalorieGoal) &&
      dailyCalorieGoal >= 500 &&
      dailyCalorieGoal <= 10000
        ? dailyCalorieGoal
        : DEFAULT_PROFILE.dailyCalorieGoal,
  }
}

export const loadProfilePreferences = (username) => {
  const savedProfile = localStorage.getItem(storageKey(username))

  if (!savedProfile) return { ...DEFAULT_PROFILE }

  try {
    return normalizeProfile(JSON.parse(savedProfile))
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

export const loadCurrentProfilePreferences = async () => {
  const user = await getCurrentUser()
  return loadProfilePreferences(user.username)
}

export const saveProfilePreferences = (username, profile) => {
  const normalizedProfile = normalizeProfile(profile)
  const storedProfile = {
    displayName: normalizedProfile.displayName,
    weeklyWorkoutGoal: normalizedProfile.weeklyWorkoutGoal,
    dailyCalorieGoal: normalizedProfile.dailyCalorieGoal,
  }

  localStorage.setItem(storageKey(username), JSON.stringify(storedProfile))
  window.dispatchEvent(
    new CustomEvent('repvelta-profile-updated', { detail: storedProfile }),
  )

  return normalizedProfile
}

export const applyCurrentGoalUpdate = async (action) => {
  if (action?.type !== 'update_profile_goals') {
    throw new Error('This goal update is not valid.')
  }

  const weeklyWorkoutGoal = Number(action.weeklyWorkoutGoal)
  const dailyCalorieGoal = Number(action.dailyCalorieGoal)

  if (
    !Number.isInteger(weeklyWorkoutGoal) ||
    weeklyWorkoutGoal < 1 ||
    weeklyWorkoutGoal > 14 ||
    !Number.isInteger(dailyCalorieGoal) ||
    dailyCalorieGoal < 500 ||
    dailyCalorieGoal > 10000
  ) {
    throw new Error('The proposed goals are outside the supported range.')
  }

  const user = await getCurrentUser()
  const currentProfile = loadProfilePreferences(user.username)

  return saveProfilePreferences(user.username, {
    ...currentProfile,
    weeklyWorkoutGoal,
    dailyCalorieGoal,
  })
}

