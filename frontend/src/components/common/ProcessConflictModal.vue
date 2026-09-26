<script setup lang="ts">
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
    <div v-if="visible" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-seal-badge">
          <span class="modal-seal-char">警</span>
        </div>
        <h3 class="modal-title">检测到 Antigravity 正在运行</h3>
        <p class="modal-desc">
          为避免 Windows 文件系统占用冲突，建议先安全关闭 Antigravity 再进行文件写入或还原操作。
        </p>
        <div class="modal-actions">
          <button class="btn btn-secondary modal-action-btn" @click="emit('cancel')">
            我先手动关闭
          </button>
          <button class="btn btn-primary modal-action-btn" @click="emit('confirmAutoClose')">
            协助关闭并继续
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
