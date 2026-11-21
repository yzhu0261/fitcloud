const DEFAULT_API_BASE_URL = 'https://jblazfcqug.execute-api.ap-southeast-2.amazonaws.com'
const DEFAULT_USER_POOL_ID = 'ap-southeast-2_7RlVyqR3g'
const DEFAULT_USER_POOL_CLIENT_ID = '661p99brp1i82o1aa2ovagud0l'

const cleanUrl = (value) => String(value || '').trim().replace(/\/+$/, '')

export const API_BASE_URL = cleanUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL

export const apiEndpoint = (path = '') => {
  const cleanPath = String(path).trim().replace(/^\/+/, '')
  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL
}

export const COGNITO_CONFIG = Object.freeze({
  userPoolId: String(import.meta.env.VITE_COGNITO_USER_POOL_ID || DEFAULT_USER_POOL_ID).trim(),
  userPoolClientId: String(
    import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || DEFAULT_USER_POOL_CLIENT_ID,
  ).trim(),
})

export const AI_COACH_API_URL = cleanUrl(import.meta.env.VITE_AI_COACH_API_URL)
export const PLANS_API_URL = cleanUrl(import.meta.env.VITE_PLANS_API_URL)
export const BODY_METRICS_API_URL = cleanUrl(import.meta.env.VITE_BODY_METRICS_API_URL)
export const PROFILE_API_URL = cleanUrl(import.meta.env.VITE_PROFILE_API_URL) || apiEndpoint('profile')
