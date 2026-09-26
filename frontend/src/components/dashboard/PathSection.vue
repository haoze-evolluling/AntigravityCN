<script setup lang="ts">
import { computed } from 'vue'
import { useAntigravity } from '@/composables/useAntigravity'
import StatusPill from '@/components/common/StatusPill.vue'

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
    return { value: '已定位', status: 'ok' as const }
  }
  return { value: '未找到', status: 'err' as const }
})

const backupStatus = computed(() => {
  if (currentStatus.value.backupExists) {
    return { value: '已备份', status: 'ok' as const }
  }
  return { value: '未备份', status: 'warn' as const }
})

const runningStatus = computed(() => {
  if (currentStatus.value.isRunning) {
    return { value: '运行中', status: 'warn' as const }
  }
  return { value: '未运行', status: 'ok' as const }
})
</script>

<template>
  <section class="paper-card path-card">
    <div class="section-meta-header">
      <div class="section-title-wrap">
        <span class="section-num">SECTION 01</span>
        <h2 class="section-heading">目标路径与状态检索</h2>
      </div>
      <div style="display: flex; gap: 8px;">
        <button
          class="paper-action-btn"
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
          class="paper-action-btn"
          :disabled="isLoading"
          title="重新检测状态"
          @click="refreshStatus(true)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path
              fill-rule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.096l.487.487a7 7 0 0 0 11.83-3.07.75.75 0 0 0-1.255-.476ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311H11.75a.75.75 0 0 0 0 1.5H15.5a.75.75 0 0 0 .75-.75V3.421a.75.75 0 0 0-1.5 0v2.096l-.487-.487a7 7 0 0 0-11.83 3.07.75.75 0 0 0 1.255.476Z"
              clip-rule="evenodd"
            />
          </svg>
          <span>刷新检索</span>
        </button>
      </div>
    </div>

    <div class="path-input-row">
      <div class="input-container">
        <span class="input-tag">PATH</span>
        <input
          type="text"
          class="text-input"
          :value="currentPath"
          placeholder="请选择或输入 app.asar 绝对路径..."
          readonly
        />
      </div>
      <button
        class="btn btn-secondary browse-btn"
        :disabled="isLoading"
        @click="browsePath"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
          <path
            d="M2 4.75C2 3.784 2.784 3 3.75 3h3.586a1.75 1.75 0 0 1 1.237.513l1.414 1.414a.25.25 0 0 0 .177.073h6.086C17.216 5.086 18 5.87 18 6.836v8.414c0 .966-.784 1.75-1.75 1.75H3.75A1.75 1.75 0 0 1 2 15.25V4.75Z"
          />
        </svg>
        <span>浏览路径</span>
      </button>
    </div>

    <!-- Status Badges / Three Status Pills -->
    <div class="status-grid">
      <StatusPill
        label="核心定位"
        :value="installStatus.value"
        :status="installStatus.status"
      />
      <StatusPill
        label="原版备份"
        :value="backupStatus.value"
        :status="backupStatus.status"
      />
      <StatusPill
        label="进程状态"
        :value="runningStatus.value"
        :status="runningStatus.status"
      />
    </div>
  </section>
</template>
