<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toastMessage, toastVisible } = useToast()
</script>

<template>
  <Transition name="snackbar-fade">
    <div v-if="toastVisible" class="md-snackbar">
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="flex-shrink: 0;">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{{ toastMessage }}</span>
    </div>
  </Transition>
</template>
