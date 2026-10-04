<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'elevated' | 'filled' | 'outlined'
  }>(),
  {
    variant: 'outlined'
  }
)
</script>

<template>
  <section class="md-card" :class="`md-card--${variant}`">
    <slot />
  </section>
</template>
