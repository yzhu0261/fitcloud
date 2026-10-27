<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth'
import { RouterLink } from 'vue-router'
import UserAvatar from './UserAvatar.vue'

const cacheKey = 'repvelta-profile-badge'
const readCache = () => {
  try {
    return JSON.parse(sessionStorage.getItem(cacheKey))
  } catch {
    return null
  }
}

const cachedProfile = readCache()
const displayName = ref(cachedProfile?.displayName || '')
const accountLabel = ref(cachedProfile?.accountLabel || 'RepVelta Member')
const isProfileReady = ref(Boolean(cachedProfile))
const avatarLabel = computed(() => displayName.value || accountLabel.value)

const cacheProfile = () => {
  sessionStorage.setItem(
    cacheKey,
    JSON.stringify({
      displayName: displayName.value,
      accountLabel: accountLabel.value,
    }),
  )
}

const loadProfile = async () => {
  try {
    const [user, attributes] = await Promise.all([getCurrentUser(), fetchUserAttributes()])
    const savedProfile = localStorage.getItem(`repvelta-profile-${user.username}`)
    const profile = savedProfile ? JSON.parse(savedProfile) : null

    displayName.value = String(profile?.displayName || '').trim()
    accountLabel.value = attributes.email || user.username || 'RepVelta Member'
    cacheProfile()
  } catch {
    if (!isProfileReady.value) {
      displayName.value = ''
      accountLabel.value = 'RepVelta Member'
    }
  } finally {
    isProfileReady.value = true
  }
}

onMounted(() => {
  loadProfile()
  window.addEventListener('repvelta-profile-updated', loadProfile)
})

onUnmounted(() => window.removeEventListener('repvelta-profile-updated', loadProfile))
</script>

<template>
  <RouterLink to="/account" class="user-profile-badge">
    <UserAvatar v-if="isProfileReady" :label="avatarLabel" :size="44" />
    <span v-else class="avatar-skeleton" aria-hidden="true"></span>
    <span class="user-profile-copy">
      <strong>{{ isProfileReady ? displayName || 'My Account' : 'My Account' }}</strong>
      <small :class="{ 'copy-skeleton': !isProfileReady }">
        {{ isProfileReady ? 'RepVelta Member' : 'Loading profile' }}
      </small>
    </span>
    <span class="badge-chevron" aria-hidden="true">›</span>
  </RouterLink>
</template>

<style scoped>
.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border: 1px solid #dfe7e2;
  border-radius: 999px;
  background: #fffefd;
  color: #172033;
  text-decoration: none;
  transition: border-color .2s ease, transform .2s ease;
}

.user-profile-badge:hover {
  border-color: #b8ca75;
  transform: translateY(-1px);
}

.user-profile-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.badge-chevron { margin-left: 3px; color: #9aa6a1; font-size: 1.35rem; line-height: 1; }

.avatar-skeleton { width: 44px; height: 44px; flex: 0 0 44px; border-radius: 50%; background: linear-gradient(100deg, #edf1ee 30%, #f8faf8 50%, #edf1ee 70%); background-size: 220% 100%; animation: profile-shimmer 1.1s linear infinite; }
.copy-skeleton { color: transparent !important; width: 92px; border-radius: 5px; background: #edf1ee; user-select: none; }
@keyframes profile-shimmer { to { background-position-x: -220%; } }

@media (prefers-reduced-motion: reduce) {
  .avatar-skeleton { animation: none; }
}

.user-profile-copy strong {
  max-width: 180px;
  overflow: hidden;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-profile-copy small {
  color: #66717f;
  font-size: .88rem;
}

@media (max-width: 650px) {
  .user-profile-badge {
    display: none;
  }
}
</style>
