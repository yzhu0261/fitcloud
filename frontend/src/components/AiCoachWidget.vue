<script setup>
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { requestCoachReply } from '../services/aiCoach'

const isOpen = ref(false)
const isSending = ref(false)
const messageInput = ref('')
const chatError = ref('')
const messageList = ref(null)
const messages = ref([
  {
    role: 'assistant',
    content: 'Hi! Ask me a quick question, or open the full coach for a detailed plan.',
  },
])

const quickPrompts = [
  'Summarise my last 7 days.',
  'Create my weekly plan.',
]

const scrollToLatest = async () => {
  await nextTick()
  messageList.value?.scrollTo({
    top: messageList.value.scrollHeight,
    behavior: 'smooth',
  })
}

const openWidget = () => {
  isOpen.value = true
  nextTick(() => document.querySelector('.coach-widget textarea')?.focus())
}

const sendMessage = async (suggestedMessage) => {
  const message = String(suggestedMessage || messageInput.value).trim()

  if (!message || isSending.value) return

  chatError.value = ''
  messageInput.value = ''
  messages.value.push({ role: 'user', content: message })
  isSending.value = true
  await scrollToLatest()

  try {
    const reply = await requestCoachReply(message)
    messages.value.push({ role: 'assistant', content: reply })
  } catch (error) {
    chatError.value = error.message || 'The AI Coach could not respond.'
  } finally {
    isSending.value = false
    await scrollToLatest()
  }
}
</script>

<template>
  <div class="coach-widget">
    <Transition name="coach-panel">
      <section v-if="isOpen" class="coach-panel" aria-label="RepVelta AI Coach">
        <header class="coach-header">
          <div class="coach-identity">
            <span class="coach-avatar">R</span>
            <span><strong>RepVelta Coach</strong><small>AI fitness assistant</small></span>
          </div>
          <button type="button" class="close-button" aria-label="Close AI Coach" @click="isOpen = false">×</button>
        </header>

        <div ref="messageList" class="widget-messages" aria-live="polite">
          <div v-for="(message, index) in messages" :key="index" :class="['widget-message', message.role]">
            <span>{{ message.role === 'assistant' ? 'R' : 'You' }}</span>
            <p>{{ message.content }}</p>
          </div>
          <div v-if="isSending" class="widget-message assistant">
            <span>R</span>
            <p>Reviewing your data…</p>
          </div>
        </div>

        <div class="quick-prompts">
          <button v-for="prompt in quickPrompts" :key="prompt" type="button" @click="sendMessage(prompt)">
            {{ prompt }}
          </button>
        </div>

        <p v-if="chatError" class="widget-error">{{ chatError }}</p>

        <form class="widget-composer" @submit.prevent="sendMessage()">
          <textarea v-model="messageInput" rows="2" maxlength="2000" placeholder="Ask your coach…" @keydown.enter.exact.prevent="sendMessage()"></textarea>
          <button type="submit" :disabled="isSending || !messageInput.trim()">Send</button>
        </form>

        <RouterLink to="/coach" class="full-coach-link">Open full coach →</RouterLink>
      </section>
    </Transition>

    <button v-if="!isOpen" type="button" class="coach-launcher" aria-label="Open RepVelta AI Coach" @click="openWidget">
      <span>R</span>
      <span class="launcher-copy"><strong>AI Coach</strong><small>Ask me anything</small></span>
    </button>
  </div>
</template>

<style scoped>
.coach-widget { position: fixed; right: 26px; bottom: 24px; z-index: 1200; font-family: Inter, Arial, Helvetica, sans-serif; color: #172033; }
.coach-launcher { display: flex; align-items: center; gap: 11px; min-width: 164px; padding: 11px 15px 11px 11px; border: 1px solid #b9d35d; border-radius: 999px; background: #173f34; color: #fff; box-shadow: 0 14px 38px rgba(28, 61, 51, .22); cursor: pointer; }
.coach-launcher > span:first-child, .coach-avatar { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; border-radius: 50%; background: #cbed63; color: #17352c; font-weight: 900; }
.launcher-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.launcher-copy strong { font-size: .98rem; }.launcher-copy small { color: #dce9e3; font-size: .78rem; }
.coach-panel { width: min(390px, calc(100vw - 32px)); height: min(610px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #d7e2dc; border-radius: 22px; background: #fffefd; box-shadow: 0 22px 60px rgba(28, 61, 51, .24); }
.coach-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px; border-bottom: 1px solid #e6ece8; background: #173f34; color: #fff; }
.coach-identity { display: flex; align-items: center; gap: 11px; }.coach-identity > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.coach-identity strong { font-size: 1rem; }.coach-identity small { color: #dce9e3; font-size: .8rem; }
.close-button { width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; font-size: 1.6rem; line-height: 1; cursor: pointer; }
.widget-messages { flex: 1; min-height: 0; padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.widget-message { display: flex; align-items: flex-start; gap: 9px; }.widget-message.user { flex-direction: row-reverse; }
.widget-message > span { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; border-radius: 10px; background: #cbed63; color: #17352c; font-size: .72rem; font-weight: 850; }
.widget-message.user > span { background: #dcefea; }
.widget-message p { max-width: 80%; margin: 0; padding: 11px 13px; border-radius: 5px 14px 14px; background: #f0f5f1; font-size: .94rem; line-height: 1.5; white-space: pre-wrap; }
.widget-message.user p { border-radius: 14px 5px 14px 14px; background: #e9f5ba; }
.quick-prompts { padding: 0 16px 12px; display: flex; gap: 7px; overflow-x: auto; }
.quick-prompts button { flex: 0 0 auto; padding: 8px 10px; border: 1px solid #d6e2da; border-radius: 999px; background: #fff; color: #315e51; font-size: .78rem; font-weight: 700; cursor: pointer; }
.widget-error { margin: 0 16px 10px; padding: 10px 12px; border-radius: 10px; background: #fff2f0; color: #a52b20; font-size: .85rem; }
.widget-composer { padding: 12px 16px 10px; border-top: 1px solid #e7ece9; display: grid; grid-template-columns: 1fr auto; gap: 9px; align-items: end; }
.widget-composer textarea { min-height: 50px; max-height: 110px; resize: vertical; padding: 11px 12px; border: 1px solid #d9e1dc; border-radius: 12px; outline: none; color: inherit; font: inherit; font-size: .92rem; line-height: 1.4; }
.widget-composer textarea:focus { border-color: #91ae3e; box-shadow: 0 0 0 3px rgba(203,237,99,.22); }
.widget-composer button { min-height: 50px; padding: 0 16px; border: 0; border-radius: 12px; background: #cbed63; color: #17352c; font-weight: 850; cursor: pointer; }
.widget-composer button:disabled { opacity: .55; cursor: not-allowed; }
.full-coach-link { display: block; padding: 3px 18px 16px; color: #315e51; font-size: .88rem; font-weight: 800; text-align: right; text-decoration: none; }
.coach-panel-enter-active, .coach-panel-leave-active { transition: opacity .18s ease, transform .18s ease; }.coach-panel-enter-from, .coach-panel-leave-to { opacity: 0; transform: translateY(12px) scale(.98); }
@media (max-width: 600px) { .coach-widget { right: 16px; bottom: 16px; }.coach-launcher { min-width: auto; padding-right: 11px; }.launcher-copy { display: none; }.coach-panel { width: calc(100vw - 32px); height: min(620px, calc(100vh - 32px)); } }
</style>
