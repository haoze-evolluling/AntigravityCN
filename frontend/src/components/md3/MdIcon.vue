<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    filled?: boolean
    weight?: number
  }>(),
  {
    size: 20,
    filled: false,
    weight: 400
  }
)

const iconStyle = computed(() => ({
  fontSize: `${props.size}px`,
  fontVariationSettings: `'FILL' ${props.filled ? 1 : 0}, 'wght' ${props.weight}, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, props.size))}`
}))
</script>

<template>
  <span class="md-icon material-symbols-rounded" aria-hidden="true" :style="iconStyle">
    {{ name }}
  </span>
</template>
