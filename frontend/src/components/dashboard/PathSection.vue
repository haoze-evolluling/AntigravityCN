<script setup lang="ts">
import { computed } from 'vue'
import { useAntigravity } from '@/composables/useAntigravity'
import MdCard from '@/components/md3/MdCard.vue'
import MdButton from '@/components/md3/MdButton.vue'
import MdIconButton from '@/components/md3/MdIconButton.vue'
import MdBadge from '@/components/md3/MdBadge.vue'

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
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm4 18H6V4h7v5h5v11Z"
              />
            </svg>
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
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path
                d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3Zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1Z"
              />
            </svg>
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
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path
                d="M4 4h16v16H4V4Zm2 4v8h12V8H6Z"
              />
            </svg>
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
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                d="M2 4.75C2 3.784 2.784 3 3.75 3h3.586a1.75 1.75 0 0 1 1.237.513l1.414 1.414a.25.25 0 0 0 .177.073h6.086C17.216 5.086 18 5.87 18 6.836v8.414c0 .966-.784 1.75-1.75 1.75H3.75A1.75 1.75 0 0 1 2 15.25V4.75Z"
              />
            </svg>
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
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path
                fill-rule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                clip-rule="evenodd"
              />
            </svg>
          </template>
          清理缓存
        </MdButton>

        <MdIconButton
          variant="tonal"
          :disabled="isLoading"
          title="刷新核心状态"
          @click="refreshStatus(true)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path
              fill-rule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.096l.487.487a7 7 0 0 0 11.83-3.07.75.75 0 0 0-1.255-.476ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311H11.75a.75.75 0 0 0 0 1.5H15.5a.75.75 0 0 0 .75-.75V3.421a.75.75 0 0 0-1.5 0v2.096l-.487-.487a7 7 0 0 0-11.83 3.07.75.75 0 0 0 1.255.476Z"
              clip-rule="evenodd"
            />
          </svg>
        </MdIconButton>
      </div>
    </MdCard>
  </div>
</template>
