<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    status?: 'ok' | 'warn' | 'err' | 'default'
  }>(),
  {
    status: 'default'
  }
)
</script>

<template>
  <div class="status-badge" :class="status">
    <span class="status-dot"></span>
    <span style="opacity: 0.7;">{{ label }} ·</span>
    <span>{{ value }}</span>
  </div>
</template>
