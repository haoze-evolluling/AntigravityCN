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
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="modal-icon-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path
                fill-rule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 class="modal-title">检测到 Antigravity 正在运行</h3>
            <p class="modal-desc" style="margin-top: 2px;">
              为避免 Windows 系统文件占用写入冲突，建议安全关闭客户端进程。
            </p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-tool" style="height: 36px; padding: 0 16px;" @click="emit('cancel')">
            我先手动关闭
          </button>
          <button
            class="btn-tool btn-tool-primary"
            style="height: 36px; padding: 0 16px;"
            @click="emit('confirmAutoClose')"
          >
            协助关闭并继续
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
