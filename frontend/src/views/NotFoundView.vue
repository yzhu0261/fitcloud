<script setup>
import { RouterLink } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
</script>

<template>
  <main class="not-found-page">
    <header class="brand">
      <BrandMark />
      <span>RepVelta</span>
    </header>

    <section class="not-found-card">
      <div class="error-number" aria-hidden="true">404</div>
      <p class="eyebrow">PAGE NOT FOUND</p>
      <h1>This route is taking a rest day.</h1>
      <p class="description">
        The page may have moved, or the address may be incorrect. Return to RepVelta and keep your
        progress moving.
      </p>

      <div class="actions">
        <RouterLink to="/" class="primary-action">Back to home</RouterLink>
        <RouterLink to="/dashboard" class="secondary-action">Open dashboard</RouterLink>
      </div>
    </section>

    <div class="decorative-ring ring-one" aria-hidden="true"></div>
    <div class="decorative-ring ring-two" aria-hidden="true"></div>
  </main>
</template>

<style scoped>
.not-found-page {
  position: relative;
  min-height: 100vh;
  padding: 38px clamp(22px, 5vw, 72px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at 13% 16%, rgba(203, 237, 99, .32), transparent 27%),
    linear-gradient(135deg, #f3f7ef 0%, #edf4f0 56%, #e5eff4 100%);
  color: #172033;
  font-family: Inter, Arial, Helvetica, sans-serif;
}

.brand {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 1.45rem;
  font-weight: 850;
}

.not-found-card {
  position: relative;
  z-index: 2;
  width: min(680px, 100%);
  margin: auto;
  padding: clamp(34px, 6vw, 68px);
  border: 1px solid rgba(205, 219, 211, .9);
  border-radius: 30px;
  background: rgba(255, 254, 253, .9);
  box-shadow: 0 28px 80px rgba(45, 69, 60, .14);
  backdrop-filter: blur(16px);
}

.error-number {
  margin-bottom: 22px;
  color: #cbed63;
  font-size: clamp(5rem, 16vw, 9rem);
  font-weight: 950;
  letter-spacing: -.08em;
  line-height: .72;
  text-shadow: 3px 3px 0 #23483c;
}

.eyebrow {
  margin: 0 0 10px;
  color: #527064;
  font-size: .85rem;
  font-weight: 850;
  letter-spacing: .13em;
}

h1 {
  max-width: 540px;
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.02;
  letter-spacing: -.04em;
}

.description {
  max-width: 560px;
  margin: 20px 0 0;
  color: #62716b;
  font-size: 1.08rem;
  line-height: 1.65;
}

.actions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
}

.actions a {
  min-height: 48px;
  padding: 13px 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 800;
  text-decoration: none;
}

.primary-action {
  background: #cbed63;
  color: #17352c;
}

.secondary-action {
  border: 1px solid #cdd9d1;
  background: #fff;
  color: #315e51;
}

.actions a:focus-visible {
  outline: 3px solid rgba(80, 112, 100, .3);
  outline-offset: 3px;
}

.decorative-ring {
  position: absolute;
  border: 34px solid rgba(49, 94, 81, .08);
  border-radius: 50%;
}

.ring-one {
  width: 360px;
  height: 360px;
  right: -120px;
  top: 7%;
}

.ring-two {
  width: 260px;
  height: 260px;
  left: -100px;
  bottom: -70px;
  border-color: rgba(203, 237, 99, .24);
}

@media (max-width: 600px) {
  .not-found-page {
    padding: 24px 16px;
  }

  .not-found-card {
    padding: 32px 24px;
    border-radius: 22px;
  }

  .actions {
    flex-direction: column;
  }

  .actions a {
    width: 100%;
  }
}
</style>
