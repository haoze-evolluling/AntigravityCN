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
  handleCleanCache,
  copyPath,
  openContainingFolder
} = useAntigravity()

const localizationStatus = computed(() => {
  if (!currentStatus.value.asarExists) {
    return {
      label: '汉化状态',
      desc: '等待检测核心文件',
      badge: '待检测',
      status: 'warn' as const
    }
  }

  if (currentStatus.value.isLocalized) {
    return {
      label: '汉化状态',
      desc: '简体中文补丁已安装',
      badge: '已汉化',
      status: 'ok' as const
    }
  }

  return {
    label: '汉化状态',
    desc: '当前为官方英文界面',
    badge: '英文原版',
    status: 'default' as const
  }
})

const coreStatus = computed(() => {
  if (!currentStatus.value.asarExists) {
    return {
      label: '核心文件',
      desc: '未找到 app.asar，请重新选择',
      badge: '未找到',
      status: 'err' as const
    }
  }

  return {
    label: '核心文件',
    desc: currentStatus.value.backupExists
      ? 'app.asar 已就绪，原版备份可用'
      : 'app.asar 已就绪，尚未生成备份',
    badge: '已就绪',
    status: 'ok' as const
  }
})

const runningStatus = computed(() => {
  if (currentStatus.value.isRunning) {
    return {
      label: '运行状态',
      desc: '客户端运行中，修改前需关闭',
      badge: '运行中',
      status: 'warn' as const
    }
  }

  return {
    label: '运行状态',
    desc: '客户端未运行，可安全修改',
    badge: '可操作',
    status: 'ok' as const
  }
})

const pathFileName = computed(() => {
  if (!currentPath.value) return '尚未选择 app.asar'
  const parts = currentPath.value.split(/[\\/]/)
  return parts[parts.length - 1] || currentPath.value
})

const pathDirectory = computed(() => {
  if (!currentPath.value) return '请浏览并选择 Antigravity 的核心文件'
  const separatorIndex = Math.max(
    currentPath.value.lastIndexOf('\\'),
    currentPath.value.lastIndexOf('/')
  )
  return separatorIndex > 0 ? currentPath.value.slice(0, separatorIndex) : currentPath.value
})
</script>

<template>
  <div class="dashboard-status">
    <div class="status-grid">
      <div class="status-card">
        <div class="status-card-top">
          <div class="status-icon-box" :class="localizationStatus.status">
            <MdIcon name="translate" :size="20" filled />
          </div>
          <MdBadge :status="localizationStatus.status" :show-dot="true">
            {{ localizationStatus.badge }}
          </MdBadge>
        </div>
        <div class="status-card-bottom">
          <span class="status-label">{{ localizationStatus.label }}</span>
          <span class="status-desc" :title="localizationStatus.desc">
            {{ localizationStatus.desc }}
          </span>
        </div>
      </div>

      <div class="status-card">
        <div class="status-card-top">
          <div class="status-icon-box" :class="coreStatus.status">
            <MdIcon name="description" :size="20" filled />
          </div>
          <MdBadge :status="coreStatus.status" :show-dot="true">
            {{ coreStatus.badge }}
          </MdBadge>
        </div>
        <div class="status-card-bottom">
          <span class="status-label">{{ coreStatus.label }}</span>
          <span class="status-desc" :title="coreStatus.desc">{{ coreStatus.desc }}</span>
        </div>
      </div>

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
          <span class="status-desc" :title="runningStatus.desc">
            {{ runningStatus.desc }}
          </span>
        </div>
      </div>
    </div>

    <MdCard variant="outlined" class="path-card">
      <div class="path-toolbar">
        <div class="path-field-block">
          <div class="path-field-meta">
            <span class="path-field-label">目标路径</span>
            <span
              class="path-backup-state"
              :class="{ available: currentStatus.backupExists }"
            >
              {{ currentStatus.backupExists ? '原版备份可用' : '原版备份未生成' }}
            </span>
          </div>

          <div class="path-field-shell" :class="{ empty: !currentPath }">
            <MdIcon name="description" :size="18" />
            <div class="path-display">
              <span class="path-file">{{ pathFileName }}</span>
              <span class="path-directory" :title="currentPath">{{ pathDirectory }}</span>
            </div>
            <MdIconButton
              class="path-inline-btn"
              title="复制完整路径"
              :disabled="!currentPath"
              @click="copyPath"
            >
              <MdIcon name="content_copy" :size="16" />
            </MdIconButton>
            <MdIconButton
              class="path-inline-btn"
              title="在文件资源管理器中打开"
              :disabled="!currentPath"
              @click="openContainingFolder"
            >
              <MdIcon name="folder_open" :size="17" />
            </MdIconButton>
          </div>
        </div>

        <div class="path-toolbar-actions">
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

          <MdButton
            variant="text"
            :disabled="isLoading"
            title="重新检测路径、备份和运行状态"
            @click="refreshStatus(true)"
          >
            <template #icon>
              <MdIcon name="refresh" :size="18" />
            </template>
            刷新检测
          </MdButton>
        </div>
      </div>
    </MdCard>
  </div>
</template>
