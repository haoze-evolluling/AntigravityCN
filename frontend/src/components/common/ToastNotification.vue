<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toastMessage, toastVisible } = useToast()
</script>

<template>
  <Transition name="toast-fade">
    <div v-if="toastVisible" class="toast">
      {{ toastMessage }}
    </div>
  </Transition>
</template>
