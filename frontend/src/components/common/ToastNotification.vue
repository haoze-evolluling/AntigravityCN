<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import MdIcon from '@/components/md3/MdIcon.vue'

const { toastMessage, toastVisible } = useToast()
</script>

<template>
  <Transition name="snackbar-fade">
    <div v-if="toastVisible" class="md-snackbar">
      <MdIcon name="info" :size="18" filled style="flex-shrink: 0;" />
      <span>{{ toastMessage }}</span>
    </div>
  </Transition>
</template>
