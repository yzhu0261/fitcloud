<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth'
import { RouterLink } from 'vue-router'
import UserAvatar from './UserAvatar.vue'

const displayName = ref('')
const accountLabel = ref('RepVelta Member')
const avatarLabel = computed(() => displayName.value || accountLabel.value)

const loadProfile = async () => {
  try {
    const [user, attributes] = await Promise.all([getCurrentUser(), fetchUserAttributes()])
    const savedProfile = localStorage.getItem(`repvelta-profile-${user.username}`)
    const profile = savedProfile ? JSON.parse(savedProfile) : null

    displayName.value = String(profile?.displayName || '').trim()
    accountLabel.value = attributes.email || user.username || 'RepVelta Member'
  } catch {
    displayName.value = ''
    accountLabel.value = 'RepVelta Member'
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
    <UserAvatar :label="avatarLabel" :size="44" />
    <span class="user-profile-copy">
      <strong>{{ displayName || 'My Account' }}</strong>
      <small>RepVelta Member</small>
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
