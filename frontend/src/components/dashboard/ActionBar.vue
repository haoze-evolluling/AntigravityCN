<script setup lang="ts">
import { computed } from 'vue'
import { useAntigravity } from '@/composables/useAntigravity'
import MdButton from '@/components/md3/MdButton.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

const {
  currentStatus,
  isLoading,
  handleApply,
  handleRestore,
  handleLaunch
} = useAntigravity()

const actionHint = computed(() => {
  if (!currentStatus.value.asarExists) {
    return '请先选择有效的 app.asar 文件，再开始安装汉化。'
  }
  if (currentStatus.value.isRunning) {
    return '客户端正在运行，安装或还原时会先请求关闭 Antigravity。'
  }
  if (currentStatus.value.isLocalized) {
    return '当前已安装简体中文补丁，可更新汉化或还原官方英文原版。'
  }
  return '核心文件已就绪，安装汉化后即可体验简体中文界面。'
})

const applyLabel = computed(() =>
  currentStatus.value.isLocalized ? '更新汉化' : '安装汉化'
)

const restoreAvailable = computed(
  () => currentStatus.value.backupExists && currentStatus.value.isLocalized
)

const restoreTitle = computed(() => {
  if (!currentStatus.value.backupExists) return '未检测到可用于还原的原版备份'
  if (!currentStatus.value.isLocalized) return '当前已是官方英文原版，无需还原'
  return '从备份还原为官方英文原版'
})
</script>

<template>
  <section class="action-section">
    <div class="action-context">
      <MdIcon name="info" :size="16" filled />
      <span>{{ actionHint }}</span>
    </div>

    <div class="actions-grid">
      <MdButton
        variant="filled"
        class="btn-action"
        :disabled="isLoading || !currentStatus.asarExists"
        :loading="isLoading"
        title="安装或更新简体中文汉化补丁"
        @click="handleApply"
      >
        <template #icon>
          <MdIcon name="translate" :size="18" />
        </template>
        {{ applyLabel }}
      </MdButton>

      <MdButton
        variant="outlined"
        class="btn-action"
        :disabled="isLoading || !restoreAvailable"
        :title="restoreTitle"
        @click="handleRestore"
      >
        <template #icon>
          <MdIcon name="settings_backup_restore" :size="18" />
        </template>
        还原英文原版
      </MdButton>

      <MdButton
        :variant="currentStatus.isRunning ? 'tonal' : 'tertiary'"
        class="btn-action"
        :disabled="isLoading || currentStatus.isRunning || !currentStatus.asarExists"
        :title="currentStatus.isRunning ? 'Antigravity 已在运行' : '启动 Antigravity 主程序'"
        @click="handleLaunch"
      >
        <template #icon>
          <MdIcon name="rocket_launch" :size="18" filled />
        </template>
        {{ currentStatus.isRunning ? 'Antigravity 已运行' : '启动 Antigravity' }}
      </MdButton>
    </div>
  </section>
</template>
