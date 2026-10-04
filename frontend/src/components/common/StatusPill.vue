<script setup lang="ts">
import MdBadge from '@/components/md3/MdBadge.vue'

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
  <MdBadge :status="status" :show-dot="true">
    <span style="opacity: 0.8;">{{ label }} ·</span>
    <span>{{ value }}</span>
  </MdBadge>
</template>
