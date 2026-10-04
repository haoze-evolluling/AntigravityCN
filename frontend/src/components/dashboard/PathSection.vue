<script setup lang="ts">
import { computed } from 'vue'
import { useAntigravity } from '@/composables/useAntigravity'
import MdCard from '@/components/md3/MdCard.vue'
import MdButton from '@/components/md3/MdButton.vue'
import MdIconButton from '@/components/md3/MdIconButton.vue'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

const {
  currentPath,
  currentStatus,
  isLoading,
  refreshStatus,
  browsePath,
  handleCleanCache
} = useAntigravity()

const installStatus = computed(() => {
  if (currentStatus.value.asarExists) {
    return {
      label: '核心文件',
      desc: '已找到 app.asar',
      badge: '正常',
      status: 'ok' as const
    }
  }
  return {
    label: '核心文件',
    desc: '未找到 app.asar',
    badge: '未找到',
    status: 'err' as const
  }
})

const backupStatus = computed(() => {
  if (currentStatus.value.backupExists) {
    return {
      label: '原版备份',
      desc: '已生成备份文件',
      badge: '已备份',
      status: 'ok' as const
    }
  }
  return {
    label: '原版备份',
    desc: '未检测到备份',
    badge: '未备份',
    status: 'warn' as const
  }
})

const runningStatus = computed(() => {
  if (currentStatus.value.isRunning) {
    return {
      label: '运行状态',
      desc: 'Antigravity 正在运行',
      badge: '运行中',
      status: 'warn' as const
    }
  }
  return {
    label: '运行状态',
    desc: '未运行，可正常修改',
    badge: '空闲',
    status: 'ok' as const
  }
})
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 14px;">
    <!-- Top Row: 3 Material 3 Status Overview Cards -->
    <div class="status-grid">
      <!-- Status Card 1: Core Asar -->
      <div class="status-card">
        <div class="status-card-top">
          <div class="status-icon-box" :class="installStatus.status">
            <MdIcon name="description" :size="20" filled />
          </div>
          <MdBadge :status="installStatus.status" :show-dot="true">
            {{ installStatus.badge }}
          </MdBadge>
        </div>
        <div class="status-card-bottom">
          <span class="status-label">{{ installStatus.label }}</span>
          <span class="status-desc" :title="installStatus.desc">{{ installStatus.desc }}</span>
        </div>
      </div>

      <!-- Status Card 2: Backup -->
      <div class="status-card">
        <div class="status-card-top">
          <div class="status-icon-box" :class="backupStatus.status">
            <MdIcon name="settings_backup_restore" :size="20" filled />
          </div>
          <MdBadge :status="backupStatus.status" :show-dot="true">
            {{ backupStatus.badge }}
          </MdBadge>
        </div>
        <div class="status-card-bottom">
          <span class="status-label">{{ backupStatus.label }}</span>
          <span class="status-desc" :title="backupStatus.desc">{{ backupStatus.desc }}</span>
        </div>
      </div>

      <!-- Status Card 3: Process -->
      <div class="status-card">
        <div class="status-card-top">
          <div class="status-icon-box" :class="runningStatus.status">
            <MdIcon name="web_asset" :size="20" filled />
          </div>
          <MdBadge :status="runningStatus.status" :show-dot="true">
            {{ runningStatus.badge }}
          </MdBadge>
        </div>
        <div class="status-card-bottom">
          <span class="status-label">{{ runningStatus.label }}</span>
          <span class="status-desc" :title="runningStatus.desc">{{ runningStatus.desc }}</span>
        </div>
      </div>
    </div>

    <!-- Middle Row: Material 3 Outlined Path Toolbar Card -->
    <MdCard variant="outlined" style="padding: 12px 14px;">
      <div class="path-toolbar">
        <div class="md-textfield-outlined" title="app.asar 目标核心文件路径">
          <span class="path-tag">ASAR</span>
          <input
            type="text"
            class="path-input"
            :value="currentPath"
            placeholder="请选择 Antigravity 的 app.asar 路径..."
            readonly
          />
        </div>

        <MdButton
          variant="tonal"
          :disabled="isLoading"
          title="选择 app.asar 文件"
          @click="browsePath"
        >
          <template #icon>
            <MdIcon name="folder_open" :size="18" />
          </template>
          浏览
        </MdButton>

        <MdButton
          variant="outlined"
          :disabled="isLoading"
          title="清理运行时临时缓存"
          @click="handleCleanCache"
        >
          <template #icon>
            <MdIcon name="delete_sweep" :size="18" />
          </template>
          清理缓存
        </MdButton>

        <MdIconButton
          variant="tonal"
          :disabled="isLoading"
          title="刷新核心状态"
          @click="refreshStatus(true)"
        >
          <MdIcon name="refresh" :size="18" />
        </MdIconButton>
      </div>
    </MdCard>
  </div>
</template>
