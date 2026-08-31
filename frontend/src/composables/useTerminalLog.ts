import { ref, nextTick } from 'vue'
import type { LogItem, LogType } from '@/types'
import { useToast } from './useToast'

const logs = ref<LogItem[]>([
  {
    id: 1,
    time: new Date().toLocaleTimeString(),
    text: 'Antigravity 简体中文深度汉化引擎已就绪。',
    type: 'system'
  }
])

let nextLogId = 2

export function useTerminalLog() {
  const { showToast } = useToast()

  function detectLogType(text: string): LogType {
    if (text.includes('===')) {
      return 'divider'
    } else if (text.includes('[OK]') || text.includes('[+]') || text.includes('完成') || text.includes('成功')) {
      return 'success'
    } else if (text.includes('[*]')) {
      return 'info'
    } else if (text.includes('[!]') || text.includes('警告')) {
      return 'warn'
    } else if (text.includes('[错误]') || text.includes('失败')) {
      return 'error'
    }
    return 'system'
  }

  function appendLog(text: string) {
    const type = detectLogType(text)
    const time = new Date().toLocaleTimeString()

    logs.value.push({
      id: nextLogId++,
      time,
      text,
      type
    })

    nextTick(() => {
      const term = document.getElementById('terminal-body')
      if (term) {
        term.scrollTop = term.scrollHeight
      }
    })
  }

  function clearLogs() {
    logs.value = []
    showToast('控制台已清空')
  }

  async function copyLogs() {
    const text = logs.value
      .map(item => `[${item.time}] ${item.text}`)
      .join('\n')

    try {
      await navigator.clipboard.writeText(text)
      showToast('日志已复制到剪贴板')
    } catch {
      showToast('复制失败，请手动选择复制')
    }
  }

  let isInitialized = false

  function initLogListener() {
    if (isInitialized) return
    isInitialized = true

    if (window.runtime && window.runtime.EventsOn) {
      window.runtime.EventsOn('log', (msg: string) => {
        appendLog(msg)
      })
    }
  }

  return {
    logs,
    appendLog,
    clearLogs,
    copyLogs,
    initLogListener
  }
}
