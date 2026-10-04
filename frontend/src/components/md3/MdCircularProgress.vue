<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    strokeWidth?: number
    color?: string
  }>(),
  {
    size: 18,
    strokeWidth: 2.5,
    color: 'currentColor'
  }
)
</script>

<template>
  <svg
    class="md-circular-progress"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
  >
    <circle
      class="md-circular-progress-track"
      cx="24"
      cy="24"
      r="18"
      :stroke="color"
      :stroke-width="strokeWidth * 2"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.md-circular-progress {
  display: inline-block;
  animation: md-progress-rotate 1.4s linear infinite;
  vertical-align: middle;
}

.md-circular-progress-track {
  stroke-dasharray: 80, 200;
  stroke-dashoffset: 0;
  animation: md-progress-dash 1.4s ease-in-out infinite;
}

@keyframes md-progress-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes md-progress-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 70, 200;
    stroke-dashoffset: -25px;
  }
  100% {
    stroke-dasharray: 70, 200;
    stroke-dashoffset: -90px;
  }
}
</style>
