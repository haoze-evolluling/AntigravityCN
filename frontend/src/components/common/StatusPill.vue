<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    status?: 'ok' | 'warn' | 'err' | 'default'
  }>(),
  {
    status: 'default'
  }
)

const statusClass = computed(() => {
  if (props.status === 'ok') return 'status-ok'
  if (props.status === 'warn') return 'status-warn'
  if (props.status === 'err') return 'status-err'
  return ''
})
</script>

<template>
  <div class="status-pill" :class="statusClass">
    <div class="status-dot-wrap">
      <span class="status-dot"></span>
    </div>
    <span class="status-label">{{ label }}</span>
    <span class="status-divider">·</span>
    <span class="status-value">{{ value }}</span>
  </div>
</template>
