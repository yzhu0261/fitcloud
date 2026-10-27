<script setup>
import { onMounted, ref } from 'vue'
import { getCurrentUser } from 'aws-amplify/auth'
import { RouterLink } from 'vue-router'

const displayName = ref('')
const initial = ref('R')

onMounted(async () => {
  try {
    const user = await getCurrentUser()
    const savedProfile = localStorage.getItem(`repvelta-profile-${user.username}`)
    const profile = savedProfile ? JSON.parse(savedProfile) : null

    displayName.value = String(profile?.displayName || '').trim()
    initial.value = (displayName.value || user.username || 'R').charAt(0).toUpperCase()
  } catch {
    displayName.value = ''
    initial.value = 'R'
  }
})
</script>

<template>
  <RouterLink to="/account" class="user-profile-badge">
    <span class="user-profile-avatar">{{ initial }}</span>
    <span class="user-profile-copy">
      <strong>{{ displayName || 'My Account' }}</strong>
      <small>RepVelta Member</small>
    </span>
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

.user-profile-avatar {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 50%;
  background: #cbed63;
  color: #17352c;
  font-weight: 850;
}

.user-profile-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
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
