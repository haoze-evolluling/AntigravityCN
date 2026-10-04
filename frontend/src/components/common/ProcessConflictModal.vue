<script setup lang="ts">
import MdButton from '@/components/md3/MdButton.vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirmAutoClose'): void
}>()
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="md-dialog-backdrop">
      <div class="md-dialog-card">
        <div style="display: flex; align-items: flex-start; gap: 16px;">
          <div class="md-dialog-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path
                fill-rule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div style="flex: 1;">
            <h3 class="md-dialog-title">Antigravity 正在运行</h3>
            <p class="md-dialog-desc" style="margin-top: 6px;">
              修改应用核心文件前需要先关闭正在运行的 Antigravity 实例，以避免文件被操作系统锁定导致补丁写入失败。
            </p>
          </div>
        </div>

        <div class="md-dialog-actions">
          <MdButton variant="text" @click="emit('cancel')">
            取消
          </MdButton>
          <MdButton variant="filled" @click="emit('confirmAutoClose')">
            关闭程序并继续
          </MdButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
