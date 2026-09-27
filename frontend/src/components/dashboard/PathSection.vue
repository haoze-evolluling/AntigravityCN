<script setup lang="ts">
import { computed } from 'vue'
import { useAntigravity } from '@/composables/useAntigravity'

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
    return { label: '核心文件', desc: 'app.asar 已就绪', badge: '已就绪', status: 'ok' as const }
  }
  return { label: '核心文件', desc: '未找到核心文件', badge: '未找到', status: 'err' as const }
})

const backupStatus = computed(() => {
  if (currentStatus.value.backupExists) {
    return { label: '原版备份', desc: '英文备份已创建', badge: '已备份', status: 'ok' as const }
  }
  return { label: '原版备份', desc: '尚未创建备份', badge: '未备份', status: 'warn' as const }
})

const runningStatus = computed(() => {
  if (currentStatus.value.isRunning) {
    return { label: '进程状态', desc: '客户端运行中', badge: '运行中', status: 'warn' as const }
  }
  return { label: '进程状态', desc: '客户端已就绪', badge: '已就绪', status: 'ok' as const }
})
</script>

<template>
  <section class="card" style="display: flex; flex-direction: column; gap: 14px;">
    <!-- 3-Column Equal Status Cards Grid -->
    <div class="status-grid">
      <!-- Status Card 1: Asar File -->
      <div class="status-card">
        <div class="status-card-left">
          <div class="status-icon-box" :class="installStatus.status">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z"
              />
            </svg>
          </div>
          <div class="status-text-wrap">
            <span class="status-label">{{ installStatus.label }}</span>
            <span class="status-desc">{{ installStatus.desc }}</span>
          </div>
        </div>
        <div class="status-badge" :class="installStatus.status">
          <span class="status-dot"></span>
          <span>{{ installStatus.badge }}</span>
        </div>
      </div>

      <!-- Status Card 2: Backup File -->
      <div class="status-card">
        <div class="status-card-left">
          <div class="status-icon-box" :class="backupStatus.status">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fill-rule="evenodd"
                d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="status-text-wrap">
            <span class="status-label">{{ backupStatus.label }}</span>
            <span class="status-desc">{{ backupStatus.desc }}</span>
          </div>
        </div>
        <div class="status-badge" :class="backupStatus.status">
          <span class="status-dot"></span>
          <span>{{ backupStatus.badge }}</span>
        </div>
      </div>

      <!-- Status Card 3: Process Status -->
      <div class="status-card">
        <div class="status-card-left">
          <div class="status-icon-box" :class="runningStatus.status">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h11.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2H4.25ZM4.25 11A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11H4.25Z"
              />
            </svg>
          </div>
          <div class="status-text-wrap">
            <span class="status-label">{{ runningStatus.label }}</span>
            <span class="status-desc">{{ runningStatus.desc }}</span>
          </div>
        </div>
        <div class="status-badge" :class="runningStatus.status">
          <span class="status-dot"></span>
          <span>{{ runningStatus.badge }}</span>
        </div>
      </div>
    </div>

    <!-- Path Selector Toolbar (Uniform 38px Height across row) -->
    <div class="path-toolbar">
      <div class="path-input-group" title="当前检测或选择的目标 app.asar 文件完整路径">
        <span class="path-tag">PATH</span>
        <input
          type="text"
          class="path-input"
          :value="currentPath"
          placeholder="请选择或定位 Antigravity 的 app.asar 文件绝对路径..."
          readonly
        />
      </div>

      <button
        class="btn-tool btn-tool-primary"
        :disabled="isLoading"
        title="在文件资源管理器中选择 app.asar 文件"
        @click="browsePath"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
          <path
            d="M2 4.75C2 3.784 2.784 3 3.75 3h3.586a1.75 1.75 0 0 1 1.237.513l1.414 1.414a.25.25 0 0 0 .177.073h6.086C17.216 5.086 18 5.87 18 6.836v8.414c0 .966-.784 1.75-1.75 1.75H3.75A1.75 1.75 0 0 1 2 15.25V4.75Z"
          />
        </svg>
        <span>浏览文件</span>
      </button>

      <button
        class="btn-tool"
        :disabled="isLoading"
        title="安全清理 Antigravity 临时渲染与编译缓存"
        @click="handleCleanCache"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path
            fill-rule="evenodd"
            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
            clip-rule="evenodd"
          />
        </svg>
        <span>清理缓存</span>
      </button>

      <button
        class="btn-tool"
        :disabled="isLoading"
        title="重新检测核心文件与进程状态"
        @click="refreshStatus(true)"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path
            fill-rule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.096l.487.487a7 7 0 0 0 11.83-3.07.75.75 0 0 0-1.255-.476ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311H11.75a.75.75 0 0 0 0 1.5H15.5a.75.75 0 0 0 .75-.75V3.421a.75.75 0 0 0-1.5 0v2.096l-.487-.487a7 7 0 0 0-11.83 3.07.75.75 0 0 0 1.255.476Z"
            clip-rule="evenodd"
          />
        </svg>
        <span>刷新</span>
      </button>
    </div>
  </section>
</template>
