<script setup lang="ts">
import MdButton from '@/components/md3/MdButton.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

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
            <MdIcon name="warning" :size="26" filled />
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
