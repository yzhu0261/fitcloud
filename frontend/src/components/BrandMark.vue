<template>
  <span class="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 48 48" role="img">
      <path class="trail" d="M10 27h8l3.8-11 6.2 19 4.2-10H38" />
      <path class="rise" d="m30.5 14.5 4-4 4 4" />
    </svg>
  </span>
</template>

<style scoped>
.brand-mark {
  width: 44px;
  height: 44px;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(23, 63, 52, 0.12);
  border-radius: 14px;
  background: linear-gradient(145deg, #dcf879 0%, #bfe96a 56%, #8ed8ae 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 8px 20px rgba(83, 126, 65, 0.2);
}

svg { width: 31px; height: 31px; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.trail { stroke: #173f34; stroke-width: 3.2; }
.rise { stroke: #fff; stroke-width: 2.7; }
</style>
