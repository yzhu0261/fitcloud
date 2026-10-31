<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { requestCoachReply } from '../services/aiCoach'
import {
  clearCoachConversation,
  loadCoachConversation,
  saveCoachConversation,
} from '../services/coachConversation'
import { parseWeeklyPlan, saveWeeklyPlan } from '../services/weeklyPlan'

const isOpen = ref(false)
const isSending = ref(false)
const regeneratingIndex = ref(-1)
const messageInput = ref('')
const chatError = ref('')
const messageList = ref(null)
const planNotice = ref('')
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

const welcomeMessage = {
  role: 'assistant',
  content: 'Hi! Ask me a quick question, or open the full coach for a detailed plan.',
}

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

const handleSavePlan = async (content) => {
  planNotice.value = ''

  try {
    await saveWeeklyPlan(content)
    planNotice.value = 'Plan saved. View today’s session on your Dashboard.'
  } catch (error) {
    chatError.value = error.message || 'The weekly plan could not be saved.'
  }
}

const sendMessage = async (suggestedMessage) => {
  const message = String(suggestedMessage || messageInput.value).trim()

  if (!message || isSending.value) return

  chatError.value = ''
  messageInput.value = ''
  const conversation = messages.value.slice(1)
  messages.value.push({ role: 'user', content: message })
  await saveCoachConversation(messages.value.slice(1))
  isSending.value = true
  await scrollToLatest()

  try {
    const reply = await requestCoachReply(message, conversation)
    messages.value.push({
      role: 'assistant',
      content: reply,
      isWeeklyPlan: Boolean(parseWeeklyPlan(reply)),
    })
    await saveCoachConversation(messages.value.slice(1))
  } catch (error) {
    chatError.value = error.message || 'The AI Coach could not respond.'
  } finally {
    isSending.value = false
    await scrollToLatest()
  }
}

const clearConversation = async () => {
  messages.value = [{ ...welcomeMessage }]
  chatError.value = ''
  planNotice.value = ''
  await clearCoachConversation()
}

const setFeedback = async (index, feedback) => {
  messages.value[index].feedback =
    messages.value[index].feedback === feedback ? undefined : feedback
  await saveCoachConversation(messages.value.slice(1))
}

const regenerateResponse = async (assistantIndex) => {
  if (isSending.value || regeneratingIndex.value >= 0) return

  const userIndex = messages.value
    .slice(0, assistantIndex)
    .findLastIndex((message) => message.role === 'user')

  if (userIndex < 0) return

  chatError.value = ''
  regeneratingIndex.value = assistantIndex

  try {
    const reply = await requestCoachReply(
      messages.value[userIndex].content,
      messages.value.slice(1, userIndex),
    )
    messages.value[assistantIndex] = {
      role: 'assistant',
      content: reply,
      isWeeklyPlan: Boolean(parseWeeklyPlan(reply)),
    }
    await saveCoachConversation(messages.value.slice(1))
  } catch (error) {
    chatError.value = error.message || 'The AI Coach could not regenerate this response.'
  } finally {
    regeneratingIndex.value = -1
  }
}

onMounted(async () => {
  const savedMessages = await loadCoachConversation()

  if (savedMessages.length) {
    messages.value = [{ ...welcomeMessage }, ...savedMessages]
  }
})
</script>

<template>
  <div class="coach-widget">
    <Transition name="coach-panel">
      <section v-if="isOpen" class="coach-panel" aria-label="RepVelta AI Coach">
        <header class="coach-header">
          <div class="coach-identity">
            <span class="coach-avatar"><img src="/images/repvelta-coach-simple.png" alt="" /></span>
            <span><strong>RepVelta Coach</strong><small>AI fitness assistant</small></span>
          </div>
          <div class="header-actions">
            <button type="button" class="clear-button" @click="clearConversation">Clear</button>
            <button type="button" class="close-button" aria-label="Close AI Coach" @click="isOpen = false">×</button>
          </div>
        </header>

        <div ref="messageList" class="widget-messages" aria-live="polite">
          <div v-for="(message, index) in messages" :key="index" :class="['widget-message', message.role]">
            <span>
              <img v-if="message.role === 'assistant'" src="/images/repvelta-coach-simple.png" alt="" />
              <template v-else>You</template>
            </span>
            <div class="widget-message-copy">
              <p>{{ message.content }}</p>
              <button v-if="message.isWeeklyPlan" type="button" class="widget-save-plan" @click="handleSavePlan(message.content)">Save plan</button>
              <div v-if="message.role === 'assistant' && index > 0" class="message-actions" aria-label="Rate this response">
                <button type="button" :class="{ selected: message.feedback === 'helpful' }" title="Helpful" @click="setFeedback(index, 'helpful')">Helpful</button>
                <button type="button" :class="{ selected: message.feedback === 'not-helpful' }" title="Not helpful" @click="setFeedback(index, 'not-helpful')">Not helpful</button>
                <button type="button" :disabled="regeneratingIndex >= 0" @click="regenerateResponse(index)">
                  {{ regeneratingIndex === index ? 'Regenerating…' : 'Try again' }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="isSending" class="widget-message assistant">
            <span><img src="/images/repvelta-coach-simple.png" alt="" /></span>
            <p>Reviewing your data…</p>
          </div>
        </div>

        <div class="quick-prompts">
          <button v-for="prompt in quickPrompts" :key="prompt" type="button" @click="sendMessage(prompt)">
            {{ prompt }}
          </button>
        </div>

        <p v-if="chatError" class="widget-error">{{ chatError }}</p>
        <p v-if="planNotice" class="widget-notice">{{ planNotice }}</p>

        <form class="widget-composer" @submit.prevent="sendMessage()">
          <textarea v-model="messageInput" rows="2" maxlength="2000" placeholder="Ask your coach…" @keydown.enter.exact.prevent="sendMessage()"></textarea>
          <button type="submit" :disabled="isSending || !messageInput.trim()">Send</button>
        </form>

        <RouterLink to="/coach" class="full-coach-link">Open full coach →</RouterLink>
      </section>
    </Transition>

    <button v-if="!isOpen" type="button" class="coach-launcher" aria-label="Open RepVelta AI Coach" @click="openWidget">
      <img class="launcher-mascot" src="/images/repvelta-coach-simple.png" alt="" />
      <span class="launcher-copy"><strong>AI Coach</strong><small>Ask me anything</small></span>
    </button>
  </div>
</template>

<style scoped>
.coach-widget { position: fixed; right: 26px; bottom: 24px; z-index: 1200; font-family: Inter, Arial, Helvetica, sans-serif; color: #172033; }
.coach-launcher { display: flex; align-items: center; gap: 11px; min-width: 164px; padding: 11px 15px 11px 11px; border: 1px solid #b9d35d; border-radius: 999px; background: #173f34; color: #fff; box-shadow: 0 14px 38px rgba(28, 61, 51, .22); cursor: pointer; }
.launcher-mascot, .coach-avatar { width: 46px; height: 46px; flex: 0 0 46px; border-radius: 50%; background: #e9f5ba; object-fit: contain; }
.coach-avatar { display: grid; place-items: center; overflow: hidden; }.coach-avatar img { width: 52px; height: 52px; object-fit: contain; }
.launcher-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.launcher-copy strong { font-size: .98rem; }.launcher-copy small { color: #dce9e3; font-size: .78rem; }
.coach-panel { width: min(470px, calc(100vw - 40px)); height: min(680px, calc(100vh - 40px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #d7e2dc; border-radius: 24px; background: #fffefd; box-shadow: 0 22px 60px rgba(28, 61, 51, .24); }
.coach-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 22px; border-bottom: 1px solid #e6ece8; background: #173f34; color: #fff; }
.coach-identity { display: flex; align-items: center; gap: 11px; }.coach-identity > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.coach-identity strong { font-size: 1.08rem; }.coach-identity small { color: #dce9e3; font-size: .9rem; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.clear-button { padding: 8px 11px; border: 1px solid rgba(255,255,255,.22); border-radius: 999px; background: transparent; color: #fff; font-size: .82rem; font-weight: 750; cursor: pointer; }
.close-button { width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; font-size: 1.6rem; line-height: 1; cursor: pointer; }
.widget-messages { flex: 1; min-height: 0; padding: 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.widget-message { display: flex; align-items: flex-start; gap: 9px; }.widget-message.user { flex-direction: row-reverse; }
.widget-message > span { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; border-radius: 10px; background: #cbed63; color: #17352c; font-size: .72rem; font-weight: 850; }
.widget-message > span img { width: 37px; height: 37px; object-fit: contain; }
.widget-message.user > span { background: #dcefea; }
.widget-message-copy { max-width: 80%; display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
.widget-message.user .widget-message-copy { align-items: flex-end; }
.widget-message p { max-width: none; margin: 0; padding: 13px 15px; border-radius: 5px 14px 14px; background: #f0f5f1; font-size: 1rem; line-height: 1.55; white-space: pre-wrap; }
.widget-message.user p { border-radius: 14px 5px 14px 14px; background: #e9f5ba; }
.widget-save-plan { padding: 8px 11px; border: 0; border-radius: 9px; background: #cbed63; color: #17352c; font-size: .8rem; font-weight: 800; cursor: pointer; }
.message-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.message-actions button { padding: 6px 9px; border: 1px solid #d7e2dc; border-radius: 999px; background: #fff; color: #52615d; font-size: .75rem; font-weight: 700; cursor: pointer; }
.message-actions button.selected { border-color: #9eb94d; background: #edf7d0; color: #315e51; }
.message-actions button:disabled { opacity: .55; cursor: wait; }
.quick-prompts { padding: 0 20px 14px; display: flex; gap: 8px; overflow-x: auto; }
.quick-prompts button { flex: 0 0 auto; padding: 9px 12px; border: 1px solid #d6e2da; border-radius: 999px; background: #fff; color: #315e51; font-size: .86rem; font-weight: 700; cursor: pointer; }
.widget-error { margin: 0 16px 10px; padding: 10px 12px; border-radius: 10px; background: #fff2f0; color: #a52b20; font-size: .85rem; }
.widget-notice { margin: 0 16px 10px; padding: 10px 12px; border-radius: 10px; background: #edf7d0; color: #315e51; font-size: .84rem; font-weight: 700; }
.widget-composer { padding: 14px 20px 12px; border-top: 1px solid #e7ece9; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; }
.widget-composer textarea { min-height: 62px; max-height: 140px; resize: vertical; padding: 13px 14px; border: 1px solid #d9e1dc; border-radius: 12px; outline: none; color: inherit; font: inherit; font-size: 1rem; line-height: 1.45; }
.widget-composer textarea:focus { border-color: #91ae3e; box-shadow: 0 0 0 3px rgba(203,237,99,.22); }
.widget-composer button { min-height: 62px; padding: 0 20px; border: 0; border-radius: 12px; background: #cbed63; color: #17352c; font-size: .95rem; font-weight: 850; cursor: pointer; }
.widget-composer button:disabled { opacity: .55; cursor: not-allowed; }
.full-coach-link { display: block; padding: 4px 22px 18px; color: #315e51; font-size: .95rem; font-weight: 800; text-align: right; text-decoration: none; }
.coach-panel-enter-active, .coach-panel-leave-active { transition: opacity .18s ease, transform .18s ease; }.coach-panel-enter-from, .coach-panel-leave-to { opacity: 0; transform: translateY(12px) scale(.98); }
@media (max-width: 1000px) { .coach-widget { bottom: 94px; }.coach-panel { height: min(680px, calc(100vh - 118px)); } }
@media (max-width: 600px) { .coach-widget { right: 16px; bottom: 90px; }.coach-launcher { min-width: auto; padding-right: 11px; }.launcher-copy { display: none; }.coach-panel { width: calc(100vw - 32px); height: min(650px, calc(100vh - 118px)); }.widget-messages { padding: 18px; } }
</style>
