<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { useTerminalLog } from '@/composables/useTerminalLog'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIconButton from '@/components/md3/MdIconButton.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

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
        <MdBadge style="font-size: 9.5px; padding: 1px 7px;">
          {{ logs.length }} 条
        </MdBadge>
      </div>

      <div class="terminal-actions">
        <MdIconButton
          variant="standard"
          class="terminal-action-btn"
          :disabled="logs.length === 0"
          title="复制全部运行日志"
          @click="copyLogs"
        >
          <MdIcon name="content_copy" :size="15" />
        </MdIconButton>

        <MdIconButton
          variant="standard"
          class="terminal-action-btn"
          :disabled="logs.length === 0"
          title="清空运行日志"
          @click="clearLogs"
        >
          <MdIcon name="delete" :size="15" />
        </MdIconButton>
      </div>
    </div>

    <div id="terminal-body" class="terminal-body">
      <div v-if="logs.length === 0" class="terminal-empty">
        <div class="terminal-empty-icon">
          <MdIcon name="info" :size="20" filled />
        </div>
        <div>
          <strong>操作日志将在这里显示</strong>
          <p>安装、还原或清理缓存后，可以查看完整执行步骤。</p>
        </div>
      </div>

      <div
        v-for="item in logs"
        :key="item.id"
        class="log-line"
        :class="`log-${item.type}`"
      >
        <span style="opacity: 0.55; font-weight: 500;">[{{ item.time }}]</span> {{ item.text }}
      </div>
    </div>
  </section>
</template>
