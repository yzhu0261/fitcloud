import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

const PROFILE_API_URL =
  import.meta.env.VITE_PROFILE_API_URL ||
  'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com/profile'

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

const storeProfilePreferences = (username, profile, notify = true) => {
  const normalizedProfile = normalizeProfile(profile)
  const storedProfile = {
    displayName: normalizedProfile.displayName,
    weeklyWorkoutGoal: normalizedProfile.weeklyWorkoutGoal,
    dailyCalorieGoal: normalizedProfile.dailyCalorieGoal,
  }

  localStorage.setItem(storageKey(username), JSON.stringify(storedProfile))

  if (notify) {
    window.dispatchEvent(
      new CustomEvent('repvelta-profile-updated', { detail: storedProfile }),
    )
  }

  return normalizedProfile
}

const getProfileAuthorization = async () => {
  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()

  if (!idToken) throw new Error('Your session has expired. Please sign in again.')
  return `Bearer ${idToken}`
}

export const loadCurrentProfilePreferences = async () => {
  const user = await getCurrentUser()
  const localProfile = loadProfilePreferences(user.username)

  try {
    const response = await fetch(PROFILE_API_URL, {
      headers: { Authorization: await getProfileAuthorization() },
    })

    if (!response.ok) return localProfile

    const result = await response.json()
    if (!result.profile) return localProfile

    return storeProfilePreferences(user.username, result.profile, false)
  } catch {
    return localProfile
  }
}

export const saveProfilePreferences = (username, profile) => {
  return storeProfilePreferences(username, profile)
}

export const saveCurrentProfilePreferences = async (profile) => {
  const user = await getCurrentUser()
  const normalizedProfile = storeProfilePreferences(user.username, profile)

  try {
    const response = await fetch(PROFILE_API_URL, {
      method: 'PUT',
      headers: {
        Authorization: await getProfileAuthorization(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizedProfile),
    })

    if (!response.ok) return { profile: normalizedProfile, cloudSynced: false }

    const result = await response.json()
    const savedProfile = storeProfilePreferences(user.username, result.profile || normalizedProfile)
    return { profile: savedProfile, cloudSynced: true }
  } catch {
    return { profile: normalizedProfile, cloudSynced: false }
  }
}

export const deleteCurrentProfilePreferences = async () => {
  const user = await getCurrentUser()
  const response = await fetch(PROFILE_API_URL, {
    method: 'DELETE',
    headers: { Authorization: await getProfileAuthorization() },
  })

  if (!response.ok) {
    throw new Error('Your cloud profile could not be deleted. Please try again.')
  }

  localStorage.removeItem(storageKey(user.username))
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
  const previousGoals = {
    weeklyWorkoutGoal: currentProfile.weeklyWorkoutGoal,
    dailyCalorieGoal: currentProfile.dailyCalorieGoal,
  }

  const result = await saveCurrentProfilePreferences({
    ...currentProfile,
    weeklyWorkoutGoal,
    dailyCalorieGoal,
  })

  return { profile: result.profile, previousGoals, cloudSynced: result.cloudSynced }
}

export const restoreCurrentGoalUpdate = async (previousGoals) => {
  const weeklyWorkoutGoal = Number(previousGoals?.weeklyWorkoutGoal)
  const dailyCalorieGoal = Number(previousGoals?.dailyCalorieGoal)

  if (
    !Number.isInteger(weeklyWorkoutGoal) ||
    weeklyWorkoutGoal < 1 ||
    weeklyWorkoutGoal > 14 ||
    !Number.isInteger(dailyCalorieGoal) ||
    dailyCalorieGoal < 500 ||
    dailyCalorieGoal > 10000
  ) {
    throw new Error('The previous goals are no longer available.')
  }

  const user = await getCurrentUser()
  const currentProfile = loadProfilePreferences(user.username)

  const result = await saveCurrentProfilePreferences({
    ...currentProfile,
    weeklyWorkoutGoal,
    dailyCalorieGoal,
  })

  return result.profile
}

