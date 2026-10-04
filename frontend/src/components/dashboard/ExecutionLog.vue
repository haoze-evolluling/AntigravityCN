<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { useTerminalLog } from '@/composables/useTerminalLog'

const { logs, clearLogs, copyLogs } = useTerminalLog()

// Auto scroll to bottom when new logs arrive
watch(
  () => logs.value.length,
  async () => {
    await nextTick()
    const el = document.getElementById('terminal-body')
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }
)
</script>

<template>
  <section class="terminal-panel">
    <div class="terminal-header">
      <div class="terminal-title-wrap">
        <span class="term-dot"></span>
        <span class="terminal-title">运行日志</span>
        <span class="badge-pill" style="font-size: 10px; padding: 1px 6px;">
          {{ logs.length }} 条
        </span>
      </div>

      <div class="terminal-actions">
        <button class="term-btn" title="复制日志" @click="copyLogs">
          <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
            <path
              d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25v-7.5Z"
            />
            <path
              d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25v-7.5Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25h-7.5Z"
            />
          </svg>
          <span>复制</span>
        </button>

        <button class="term-btn" title="清空日志" @click="clearLogs">
          <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
            <path
              fill-rule="evenodd"
              d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.074l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.074l.275-5.5a.75.75 0 0 1 .786-.713Z"
              clip-rule="evenodd"
            />
          </svg>
          <span>清空</span>
        </button>
      </div>
    </div>

    <div id="terminal-body" class="terminal-body">
      <div
        v-for="item in logs"
        :key="item.id"
        class="log-line"
        :class="`log-${item.type}`"
      >
        <span style="color: var(--text-muted); font-weight: 500;">[{{ item.time }}]</span> {{ item.text }}
      </div>
    </div>
  </section>
</template>
