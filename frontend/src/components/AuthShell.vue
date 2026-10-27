<script setup>
import { RouterLink } from 'vue-router'
import BrandMark from './BrandMark.vue'

defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <main class="auth-page">
    <div class="auth-frame">
      <section class="story-panel">
      <RouterLink to="/" class="brand" aria-label="RepVelta home">
        <BrandMark /><span>RepVelta</span>
      </RouterLink>
      <div class="story-content">
        <p class="story-label">BUILT FOR CONSISTENCY</p>
        <h2>Train today.<br />Stronger tomorrow.</h2>
        <p>Log every session, fuel your body and keep the momentum moving in the right direction.</p>
        <div class="feature-list" aria-label="RepVelta features">
          <div><span>01</span><p>Build and save every workout</p></div>
          <div><span>02</span><p>Track meals and daily nutrition</p></div>
          <div><span>03</span><p>See your consistency grow</p></div>
        </div>
      </div>
      <p class="story-footer">Train · Track · Improve</p>
      </section>

      <section class="form-panel">
        <div class="auth-card">
          <p class="eyebrow">{{ eyebrow }}</p>
          <h1>{{ title }}</h1>
          <p class="description">{{ description }}</p>
          <slot />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }

.auth-page {
  width: 100%;
  min-height: 100vh;
  padding: 40px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 10% 15%, rgba(203, 237, 99, .42), transparent 25%),
    radial-gradient(circle at 88% 85%, rgba(216, 236, 248, .68), transparent 27%),
    #edf2ed;
  color: #172033;
  font-family: Inter, Arial, Helvetica, sans-serif;
}

.auth-frame {
  width: min(1280px, 100%);
  min-height: 760px;
  display: grid;
  grid-template-columns: .92fr 1.08fr;
  overflow: hidden;
  border: 1px solid rgba(25, 68, 56, .1);
  border-radius: 32px;
  background: #fffefa;
  box-shadow: 0 28px 80px rgba(23, 53, 44, .15);
}

.story-panel {
  position: relative;
  min-height: 760px;
  padding: 48px 54px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(145deg, #245247 0%, #34705c 100%);
  color: #fff;
}

.story-panel::before,
.story-panel::after {
  position: absolute;
  content: '';
  border-radius: 50%;
  pointer-events: none;
}

.story-panel::before {
  width: 330px;
  height: 330px;
  right: -170px;
  top: 20%;
  border: 62px solid rgba(203, 237, 99, .12);
}

.story-panel::after {
  width: 240px;
  height: 240px;
  left: -125px;
  bottom: -80px;
  background: rgba(216, 236, 248, .1);
}

.brand {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 14px;
  color: #fff;
  font-size: 1.6rem;
  font-weight: 800;
  text-decoration: none;
}

.brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: #cbed63;
  color: #17352c;
  font-size: 1.2rem;
  font-weight: 900;
}

.story-content { position: relative; z-index: 1; max-width: 510px; }
.story-label { margin: 0 0 20px; color: #cbed63; font-size: 1rem; font-weight: 800; letter-spacing: .13em; }
.story-content h2 { margin: 0; font-size: clamp(3.35rem, 4vw, 4.5rem); line-height: .98; letter-spacing: -.055em; }
.story-content > p:not(.story-label) { max-width: 470px; margin: 28px 0 36px; color: #e1ebe6; font-size: 1.16rem; line-height: 1.7; }
.feature-list { display: grid; gap: 16px; }
.feature-list div { display: flex; align-items: center; gap: 16px; }
.feature-list span { width: 42px; height: 42px; display: grid; flex: 0 0 auto; place-items: center; border: 1px solid rgba(203, 237, 99, .35); border-radius: 50%; background: rgba(203, 237, 99, .08); color: #cbed63; font-size: .88rem; font-weight: 800; }
.feature-list p { margin: 0; color: #f4f7f5; font-size: 1.08rem; font-weight: 650; }
.story-footer { position: relative; z-index: 1; margin: 0; color: #d2e2db; font-size: .96rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }

.form-panel { min-height: 760px; padding: 70px 84px; display: grid; place-items: center; background: #fffefa; }
.auth-card { width: min(100%, 510px); }
.eyebrow { margin: 0 0 12px; color: #65717f; font-size: 1rem; font-weight: 800; letter-spacing: .12em; }
.auth-card h1 { margin: 0; font-size: clamp(2.6rem, 3vw, 3.15rem); line-height: 1.12; letter-spacing: -.04em; }
.description { margin: 16px 0 36px; color: #5f6b79; font-size: 1.16rem; line-height: 1.6; }

:deep(.auth-form) { display: grid; gap: 22px; }
:deep(.form-group) { display: grid; gap: 9px; }
:deep(.form-group label) { font-size: 1.08rem; font-weight: 750; }
:deep(.input-wrap) { position: relative; width: 100%; }
:deep(.form-group input) { box-sizing: border-box; width: 100%; min-height: 62px; padding: 0 18px; border: 1px solid #dce1e6; border-radius: 14px; outline: none; background: #fff; color: #172033; font: inherit; font-size: 1.12rem; transition: border-color .2s ease, box-shadow .2s ease; }
:deep(.input-wrap input) { padding-right: 78px; }
:deep(.form-group input:focus) { border-color: #79a832; box-shadow: 0 0 0 4px rgba(182, 218, 79, .2); }
:deep(.form-group input[aria-invalid='true']) { border-color: #d36b61; }
:deep(.password-toggle) { position: absolute; top: 50%; right: 14px; padding: 8px; border: 0; transform: translateY(-50%); background: transparent; color: #586574; font-size: .98rem; font-weight: 750; cursor: pointer; }
:deep(.field-error) { margin: 0; color: #b42318; font-size: 1rem; line-height: 1.5; }
:deep(.field-hint) { margin: 0; color: #697584; font-size: .98rem; line-height: 1.5; }
:deep(.alert) { padding: 15px 17px; border-radius: 13px; font-size: 1.02rem; line-height: 1.5; }
:deep(.alert-error) { border: 1px solid #f2cbc7; background: #fff2f0; color: #9d2c23; }
:deep(.alert-success) { border: 1px solid #d9e8a5; background: #f6fadf; color: #43541c; }
:deep(.auth-card > .alert) { margin-bottom: 22px; }
:deep(.submit-button) { min-height: 62px; border: 0; border-radius: 14px; background: #cbed63; color: #17352c; font: inherit; font-size: 1.12rem; font-weight: 850; cursor: pointer; box-shadow: 0 8px 22px rgba(121, 168, 50, .2); transition: transform .2s ease, background .2s ease; }
:deep(.submit-button:hover:not(:disabled)) { transform: translateY(-1px); background: #bfe24e; }
:deep(.submit-button:disabled) { cursor: wait; opacity: .65; }
:deep(.auth-switch) { margin: 28px 0 0; color: #606c7a; font-size: 1.06rem; line-height: 1.5; text-align: center; }
:deep(.auth-switch a),
:deep(.text-button) { border: 0; background: transparent; color: #172033; font: inherit; font-weight: 800; text-decoration: none; cursor: pointer; }

@media (max-width: 880px) {
  .auth-page { padding: 0; place-items: stretch; background: #fffefd; }
  .auth-frame { min-height: 100vh; grid-template-columns: 1fr; border: 0; border-radius: 0; box-shadow: none; }
  .story-panel { min-height: auto; padding: 24px; }
  .story-content, .story-footer { display: none; }
  .brand { font-size: 1.35rem; }
  .brand-mark { width: 42px; height: 42px; }
  .form-panel { min-height: calc(100vh - 90px); padding: 48px 24px; align-items: start; }
  .auth-card { margin: 0 auto; }
  .auth-card h1 { font-size: clamp(2.25rem, 9vw, 2.75rem); }
}

@media (max-height: 840px) and (min-width: 881px) {
  .auth-page { padding: 20px; }
  .auth-frame, .story-panel, .form-panel { min-height: 700px; }
  .story-panel { padding: 36px 44px; }
  .form-panel { padding: 48px 68px; }
  .story-content h2 { font-size: clamp(3rem, 4vw, 3.75rem); }
  .story-content > p:not(.story-label) { margin: 16px 0 22px; }
  .feature-list { gap: 11px; }
}
</style>
