<script setup>
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchAuthSession } from 'aws-amplify/auth'

const apiUrl = import.meta.env.VITE_AI_COACH_API_URL
const messageInput = ref('')
const isSending = ref(false)
const chatError = ref('')
const messageList = ref(null)

const messages = ref([
  {
    role: 'assistant',
    content:
      'Hi, I’m your RepVelta AI Coach. Ask me about your recent workouts, nutrition, or seven-day progress.',
  },
])

const suggestions = [
  'Summarise my last 7 days.',
  'How has my training been recently?',
  'Review my recent nutrition records.',
]

const scrollToLatest = async () => {
  await nextTick()
  messageList.value?.scrollTo({
    top: messageList.value.scrollHeight,
    behavior: 'smooth',
  })
}

const sendMessage = async (suggestedMessage) => {
  const message = String(suggestedMessage || messageInput.value).trim()

  if (!message || isSending.value) return

  chatError.value = ''
  messageInput.value = ''
  messages.value.push({ role: 'user', content: message })
  isSending.value = true
  await scrollToLatest()

  if (!apiUrl) {
    chatError.value =
      'AI Coach is not connected yet. Add VITE_AI_COACH_API_URL to the frontend environment after the Lambda API is deployed.'
    isSending.value = false
    return
  }

  try {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()

    if (!idToken) {
      throw new Error('Your session has expired. Please sign in again.')
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'The AI Coach could not respond.')
    }

    messages.value.push({ role: 'assistant', content: result.reply })
  } catch (error) {
    chatError.value = error.message || 'The AI Coach could not respond.'
  } finally {
    isSending.value = false
    await scrollToLatest()
  }
}
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand"><div class="brand-mark">R</div><span>RepVelta</span></div>
        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item"><span>▦</span> Dashboard</RouterLink>
          <RouterLink to="/workout" class="nav-item"><span>◫</span> Workout</RouterLink>
          <RouterLink to="/nutrition" class="nav-item"><span>◉</span> Nutrition</RouterLink>
          <RouterLink to="/progress" class="nav-item"><span>⌁</span> Progress</RouterLink>
          <RouterLink to="/coach" class="nav-item"><span>✦</span> AI Coach</RouterLink>
          <RouterLink to="/account" class="nav-item"><span>●</span> My Account</RouterLink>
        </nav>
      </div>

      <div class="sidebar-card">
        <div class="sidebar-card-icon">✦</div>
        <h3>Ask.<br />Learn.<br />Improve.</h3>
        <p>Your coach can review saved activity but cannot change your records.</p>
      </div>
    </aside>

    <section class="main-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">REPVELTA INTELLIGENCE</p>
          <h1>AI Fitness Coach</h1>
          <p>Get personalised observations from your saved training and nutrition data.</p>
        </div>
        <RouterLink to="/account" class="profile"><span class="profile-avatar">A</span><span><strong>My Account</strong><small>RepVelta Member</small></span></RouterLink>
      </header>

      <section class="coach-layout">
        <article class="chat-card">
          <div ref="messageList" class="message-list" aria-live="polite">
            <div v-for="(message, index) in messages" :key="index" :class="['message-row', message.role]">
              <div class="message-avatar">{{ message.role === 'assistant' ? 'R' : 'You' }}</div>
              <p>{{ message.content }}</p>
            </div>

            <div v-if="isSending" class="message-row assistant">
              <div class="message-avatar">R</div>
              <p class="typing">Reviewing your data<span>…</span></p>
            </div>
          </div>

          <div class="suggestions">
            <button v-for="suggestion in suggestions" :key="suggestion" type="button" @click="sendMessage(suggestion)">
              {{ suggestion }}
            </button>
          </div>

          <p v-if="chatError" class="chat-error">{{ chatError }}</p>

          <form class="composer" @submit.prevent="sendMessage()">
            <textarea v-model="messageInput" maxlength="2000" rows="2" placeholder="Ask about your workouts or nutrition…" @keydown.enter.exact.prevent="sendMessage()"></textarea>
            <button type="submit" :disabled="isSending || !messageInput.trim()">Send</button>
          </form>
        </article>

        <aside class="coach-info">
          <p class="eyebrow">AVAILABLE TOOLS</p>
          <h2>What your coach can do</h2>
          <ul>
            <li><span>01</span> Review recent workouts</li>
            <li><span>02</span> Review nutrition records</li>
            <li><span>03</span> Calculate seven-day progress</li>
          </ul>
          <div class="safety-note"><strong>Health note</strong><p>AI guidance is educational and does not replace medical or professional advice.</p></div>
        </aside>
      </section>
    </section>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 270px 1fr; background: #f1f5f2; color: #172033; font-family: Inter, Arial, Helvetica, sans-serif; }
.sidebar { min-height: 100vh; padding: 36px 28px; border-right: 1px solid #dfe8e2; background: #fffefd; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 46px; font-size: 1.5rem; font-weight: 800; }
.brand-mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; background: #cbed63; color: #17352c; font-weight: 900; }
.nav-menu { display: flex; flex-direction: column; gap: 10px; }
.nav-item { display: flex; align-items: center; gap: 13px; padding: 14px 16px; border-radius: 12px; color: #52615d; font-size: 1.06rem; font-weight: 550; text-decoration: none; }
.nav-item span { min-width: 18px; text-align: center; }
.nav-item:hover { background: #eef4ef; }
.nav-item.router-link-exact-active { background: #dff09b; color: #17352c; font-weight: 750; }
.sidebar-card { padding: 22px; border: 1px solid #d4e4d9; border-radius: 18px; background: #e5f0e8; }
.sidebar-card-icon { margin-bottom: 14px; font-size: 1.35rem; }
.sidebar-card h3 { margin: 0; font-size: 1.45rem; line-height: 1.08; }
.sidebar-card p { margin: 13px 0 0; color: #536760; font-size: 1rem; line-height: 1.55; }
.main-content { width: 100%; max-width: 1500px; margin: 0 auto; padding: 42px 50px 60px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
.eyebrow { margin: 0; color: #65717f; font-size: .95rem; font-weight: 800; letter-spacing: .1em; }
.topbar h1 { margin: 6px 0 8px; font-size: 2.6rem; }
.topbar > div > p:last-child { margin: 0; color: #596574; font-size: 1.1rem; line-height: 1.55; }
.profile { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border: 1px solid #e7e9ed; border-radius: 999px; background: #fffefd; color: inherit; text-decoration: none; }
.profile-avatar { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #cbed63; font-weight: 850; }
.profile > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.profile strong { font-size: 1rem; }.profile small { color: #66717f; font-size: .88rem; }
.coach-layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 22px; align-items: start; }
.chat-card, .coach-info { border: 1px solid #e2e7e4; border-radius: 20px; background: #fffefd; }
.chat-card { overflow: hidden; }
.message-list { height: 500px; padding: 28px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.message-row { display: flex; align-items: flex-start; gap: 12px; }
.message-row.user { flex-direction: row-reverse; }
.message-avatar { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; border-radius: 13px; background: #cbed63; color: #17352c; font-size: .85rem; font-weight: 850; }
.message-row.user .message-avatar { background: #dcefea; }
.message-row p { max-width: 76%; margin: 0; padding: 14px 16px; border-radius: 6px 16px 16px; background: #f0f5f1; font-size: 1rem; line-height: 1.6; white-space: pre-wrap; }
.message-row.user p { border-radius: 16px 6px 16px 16px; background: #e9f5ba; }
.typing span { display: inline-block; animation: pulse 1s ease-in-out infinite; }
.suggestions { padding: 0 24px 18px; display: flex; flex-wrap: wrap; gap: 8px; }
.suggestions button { padding: 9px 12px; border: 1px solid #d9e3dc; border-radius: 999px; background: #fff; color: #315e51; font-size: .9rem; font-weight: 650; cursor: pointer; }
.suggestions button:hover { border-color: #b8ca75; background: #f4f9e3; }
.chat-error { margin: 0 24px 16px; padding: 12px 14px; border-radius: 10px; background: #fff2f0; color: #a52b20; font-size: .95rem; line-height: 1.45; }
.composer { padding: 18px 24px 24px; border-top: 1px solid #e8ece9; display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end; }
.composer textarea { width: 100%; min-height: 58px; max-height: 150px; resize: vertical; padding: 14px 15px; border: 1px solid #dce2df; border-radius: 13px; outline: none; color: #172033; font: inherit; font-size: 1rem; line-height: 1.5; }
.composer textarea:focus { border-color: #91ae3e; box-shadow: 0 0 0 3px rgba(203, 237, 99, .25); }
.composer button { min-height: 58px; padding: 0 24px; border: 0; border-radius: 13px; background: #cbed63; color: #17352c; font-size: 1rem; font-weight: 850; cursor: pointer; }
.composer button:disabled { opacity: .55; cursor: not-allowed; }
.coach-info { padding: 26px; }
.coach-info h2 { margin: 7px 0 24px; font-size: 1.45rem; }
.coach-info ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 14px; }
.coach-info li { display: flex; align-items: center; gap: 12px; font-size: 1rem; font-weight: 700; }
.coach-info li span { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #d4e4d9; border-radius: 50%; color: #527064; font-size: .8rem; }
.safety-note { margin-top: 26px; padding: 18px; border-radius: 14px; background: #fff5cf; }
.safety-note strong { font-size: 1rem; }.safety-note p { margin: 7px 0 0; color: #665c39; font-size: .93rem; line-height: 1.5; }
@keyframes pulse { 50% { opacity: .35; } }
@media (max-width: 1050px) { .coach-layout { grid-template-columns: 1fr; } .coach-info { order: -1; } }
@media (max-width: 1000px) { .app-shell { grid-template-columns: 1fr; } .sidebar { display: none; } }
@media (max-width: 650px) { .main-content { padding: 24px 16px 40px; } .profile { display: none; } .message-list { height: 440px; padding: 20px 16px; } .message-row p { max-width: 84%; } .composer { grid-template-columns: 1fr; padding: 16px; } .composer button { width: 100%; } .suggestions { padding: 0 16px 16px; } }
</style>
