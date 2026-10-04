<script setup lang="ts">
import { computed } from 'vue'
import { vRipple } from '@/directives/vRipple'
import MdCircularProgress from './MdCircularProgress.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'tertiary'
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
    title?: string
  }>(),
  {
    variant: 'filled',
    disabled: false,
    loading: false,
    type: 'button',
    title: undefined
  }
)

const emit = defineEmits<{
  (e: 'click', evt: MouseEvent): void
}>()

const buttonClass = computed(() => {
  return [
    'md-btn',
    'md-state-layer',
    `md-btn--${props.variant}`,
    { 'is-loading': props.loading }
  ]
})

function handleClick(evt: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', evt)
  }
}
</script>

<template>
  <button
    v-ripple
    :type="type"
    :class="buttonClass"
    :disabled="disabled || loading"
    :title="title"
    @click="handleClick"
  >
    <template v-if="loading">
      <MdCircularProgress :size="16" :stroke-width="2.5" />
    </template>
    <span v-else-if="$slots.icon" class="md-btn-icon">
      <slot name="icon" />
    </span>

    <span class="md-btn-label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.md-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--md-comp-button-icon-size);
  height: var(--md-comp-button-icon-size);
  flex-shrink: 0;
}

.md-btn-label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
</style>
