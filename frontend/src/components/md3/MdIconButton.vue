<script setup lang="ts">
import { vRipple } from '@/directives/vRipple'

withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    title?: string
    variant?: 'standard' | 'filled' | 'tonal' | 'outlined'
  }>(),
  {
    type: 'button',
    disabled: false,
    title: undefined,
    variant: 'standard'
  }
)

defineEmits<{
  (e: 'click', evt: MouseEvent): void
}>()
</script>

<template>
  <button
    v-ripple
    :type="type"
    class="md-icon-btn md-state-layer"
    :class="`md-icon-btn--${variant}`"
    :disabled="disabled"
    :title="title"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
