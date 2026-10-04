<script setup lang="ts">
withDefaults(
  defineProps<{
    status?: 'ok' | 'warn' | 'err' | 'default'
    showDot?: boolean
  }>(),
  {
    status: 'default',
    showDot: false
  }
)
</script>

<template>
  <span class="md-badge" :class="status">
    <span v-if="showDot" class="md-status-dot"></span>
    <slot />
  </span>
</template>
