<script setup>
import { RouterLink } from 'vue-router'

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
      <RouterLink to="/" class="brand" aria-label="FitCloud home">
        <span class="brand-mark">F</span><span>FitCloud</span>
      </RouterLink>
      <div class="story-content">
        <p class="story-label">BUILT FOR CONSISTENCY</p>
        <h2>Train today.<br />Stronger tomorrow.</h2>
        <p>Log every session, fuel your body and keep the momentum moving in the right direction.</p>
        <div class="feature-list" aria-label="FitCloud features">
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
.auth-page { min-height: 100vh; display: grid; grid-template-columns: minmax(360px, .9fr) minmax(480px, 1.1fr); background: #f4f6f8; color: #172033; font-family: Inter, Arial, Helvetica, sans-serif; }
.story-panel { position: relative; min-height: 100vh; padding: 38px 46px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(145deg, #245247 0%, #34705c 100%); color: #fff; }
.story-panel::before, .story-panel::after { position: absolute; content: ''; border-radius: 50%; pointer-events: none; }
.story-panel::before { width: 390px; height: 390px; right: -190px; top: 12%; border: 58px solid rgba(203, 237, 99, .12); background: transparent; }
.story-panel::after { width: 280px; height: 280px; left: -145px; bottom: -95px; background: rgba(216, 236, 248, .1); }
.brand { position: relative; z-index: 1; display: inline-flex; align-items: center; align-self: flex-start; gap: 11px; color: #fff; font-size: 1.2rem; font-weight: 800; text-decoration: none; }
.brand-mark { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: #cbed63; color: #17352c; font-weight: 900; }
.story-content { position: relative; z-index: 1; max-width: 470px; }
.story-label { margin: 0 0 18px; color: #cbed63; font-size: .72rem; font-weight: 800; letter-spacing: .14em; }
.story-content h2 { margin: 0; font-size: clamp(2.7rem, 5vw, 4.8rem); line-height: .98; letter-spacing: -.055em; }
.story-content > p:not(.story-label) { max-width: 430px; margin: 25px 0 35px; color: #c9d0dc; font-size: .95rem; line-height: 1.7; }
.feature-list { display: grid; gap: 14px; }
.feature-list div { display: flex; align-items: center; gap: 14px; }
.feature-list span { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(203, 237, 99, .35); border-radius: 50%; background: rgba(203, 237, 99, .08); color: #cbed63; font-size: .66rem; font-weight: 800; }
.feature-list p { margin: 0; color: #eef1f5; font-size: .85rem; font-weight: 600; }
.story-footer { position: relative; z-index: 1; margin: 0; color: #bfd4cb; font-size: .7rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.form-panel { min-height: 100vh; padding: 50px 28px; display: grid; place-items: center; }
.auth-card { width: min(100%, 460px); }
.eyebrow { margin: 0 0 10px; color: #7b8492; font-size: .72rem; font-weight: 800; letter-spacing: .12em; }
.auth-card h1 { margin: 0; font-size: clamp(2rem, 4vw, 2.7rem); letter-spacing: -.04em; }
.description { margin: 12px 0 30px; color: #727b89; font-size: .92rem; line-height: 1.55; }
:deep(.auth-form) { display: grid; gap: 19px; }
:deep(.form-group) { display: grid; gap: 8px; }
:deep(.form-group label) { font-size: .8rem; font-weight: 750; }
:deep(.input-wrap) { position: relative; width: 100%; }
:deep(.form-group input) { box-sizing: border-box; width: 100%; min-height: 50px; padding: 0 14px; border: 1px solid #dce1e6; border-radius: 13px; outline: none; background: #fff; color: #172033; font: inherit; transition: border-color .2s ease, box-shadow .2s ease; }
:deep(.input-wrap input) { padding-right: 66px; }
:deep(.form-group input:focus) { border-color: #79a832; box-shadow: 0 0 0 4px rgba(182, 218, 79, .2); }
:deep(.form-group input[aria-invalid='true']) { border-color: #d36b61; }
:deep(.password-toggle) { position: absolute; top: 50%; right: 12px; padding: 5px; border: 0; transform: translateY(-50%); background: transparent; color: #687280; font-size: .72rem; font-weight: 750; cursor: pointer; }
:deep(.field-error) { margin: 0; color: #b42318; font-size: .76rem; }
:deep(.field-hint) { margin: 0; color: #858e9b; font-size: .74rem; }
:deep(.alert) { padding: 12px 14px; border-radius: 12px; font-size: .8rem; line-height: 1.45; }
:deep(.alert-error) { border: 1px solid #f2cbc7; background: #fff2f0; color: #9d2c23; }
:deep(.alert-success) { border: 1px solid #d9e8a5; background: #f6fadf; color: #43541c; }
:deep(.auth-card > .alert) { margin-bottom: 19px; }
:deep(.submit-button) { min-height: 50px; border: 0; border-radius: 13px; background: #cbed63; color: #17352c; font: inherit; font-size: .86rem; font-weight: 850; cursor: pointer; box-shadow: 0 8px 22px rgba(121, 168, 50, .2); transition: transform .2s ease, background .2s ease; }
:deep(.submit-button:hover:not(:disabled)) { transform: translateY(-1px); background: #bfe24e; }
:deep(.submit-button:disabled) { cursor: wait; opacity: .65; }
:deep(.auth-switch) { margin: 25px 0 0; color: #78818f; font-size: .82rem; text-align: center; }
:deep(.auth-switch a), :deep(.text-button) { border: 0; background: transparent; color: #172033; font: inherit; font-weight: 800; text-decoration: none; cursor: pointer; }
.auth-page {
  width: 100%;
  min-height: 100vh;
  padding: 34px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  background:
    radial-gradient(circle at 10% 15%, rgba(203, 237, 99, .42), transparent 25%),
    radial-gradient(circle at 88% 85%, rgba(216, 236, 248, .68), transparent 27%),
    #edf2ed;
}

.auth-frame {
  width: min(1080px, 100%);
  min-height: 680px;
  display: grid;
  grid-template-columns: .86fr 1.14fr;
  overflow: hidden;
  border: 1px solid rgba(25, 68, 56, .1);
  border-radius: 30px;
  background: #fffefa;
  box-shadow: 0 28px 80px rgba(23, 53, 44, .15);
}

.story-panel {
  min-height: 680px;
  padding: 38px 40px;
  background: linear-gradient(145deg, #245247 0%, #34705c 100%);
}

.story-panel::before {
  width: 280px;
  height: 280px;
  right: -145px;
  top: 20%;
}

.story-panel::after {
  width: 210px;
  height: 210px;
  left: -110px;
  bottom: -70px;
}

.story-content h2 {
  font-size: clamp(2.5rem, 4vw, 3.75rem);
  line-height: 1.01;
}

.story-content > p:not(.story-label) {
  margin: 22px 0 32px;
  font-size: .88rem;
}

.form-panel {
  min-height: 680px;
  padding: 58px 68px;
  background: #fffefa;
}

.auth-card {
  width: min(100%, 430px);
}

.auth-card h1 {
  font-size: clamp(2rem, 3vw, 2.45rem);
}

@media (max-width: 880px) {
  .auth-page { padding: 0; place-items: stretch; background: #fffefd; }
  .auth-frame { min-height: 100vh; grid-template-columns: 1fr; border: 0; border-radius: 0; box-shadow: none; }
  .story-panel { min-height: auto; padding: 22px 24px; }
  .story-content, .story-footer { display: none; }
  .form-panel { min-height: calc(100vh - 82px); padding: 46px 24px; align-items: start; }
  .auth-card { margin: 0 auto; }
}

@media (max-height: 760px) and (min-width: 881px) {
  .auth-page { padding: 20px; }
  .auth-frame, .story-panel, .form-panel { min-height: 620px; }
  .story-content > p:not(.story-label) { margin: 16px 0 22px; }
  .feature-list { gap: 9px; }
}
</style>
