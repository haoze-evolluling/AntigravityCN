import { ref } from 'vue'
import type { AppState, PendingAction } from '@/types'
import { useToast } from './useToast'
import { useTerminalLog } from './useTerminalLog'

import {
  GetInitialState,
  RefreshStatus,
  SelectAsarFile,
  ApplyPatch,
  RestoreOriginal,
  CleanAppCache,
  LaunchAntigravity,
  OpenURL
} from '@/../wailsjs/go/main/App'
import { BrowserOpenURL } from '@/../wailsjs/runtime'

const GITHUB_REPO_URL = 'https://github.com/haoze-evolluling/AntigravityCN'

const currentPath = ref('')
const currentStatus = ref<AppState>({
  asarPath: '',
  asarExists: false,
  backupExists: false,
  isRunning: false
})
const isLoading = ref(false)
const showConflictModal = ref(false)
const pendingAction = ref<PendingAction>(null)

export function useAntigravity() {
  const { showToast } = useToast()
  const { appendLog } = useTerminalLog()

  function updateState(state: AppState) {
    currentPath.value = state.asarPath || ''
    currentStatus.value = {
      asarPath: state.asarPath || '',
      asarExists: Boolean(state.asarExists),
      backupExists: Boolean(state.backupExists),
      isRunning: Boolean(state.isRunning)
    }
  }

  async function loadInitialState() {
    try {
      const state = await GetInitialState()
      updateState(state)
    } catch (err) {
      appendLog(`[错误] 获取初始状态失败: ${err}`)
    }
  }

  async function refreshStatus(showFeedback = false) {
    try {
      const state = await RefreshStatus(currentPath.value)
      updateState(state)
      if (showFeedback) {
        showToast('状态已刷新')
      }
    } catch (err) {
      appendLog(`[错误] 刷新状态失败: ${err}`)
    }
  }

  async function browsePath() {
    try {
      const selected = await SelectAsarFile()
      if (selected) {
        currentPath.value = selected
        await refreshStatus()
        appendLog(`[*] 已选择文件: ${selected}`)
      }
    } catch (err) {
      appendLog(`[错误] 选择文件失败: ${err}`)
    }
  }

  async function executeAction(
    actionFn: () => Promise<{ success: boolean; message: string }>,
    successMsg: string,
    failPrefix: string
  ) {
    isLoading.value = true
    try {
      const res = await actionFn()
      if (res && res.success) {
        showToast(successMsg)
      } else {
        showToast(`${failPrefix}: ${res ? res.message : '未知错误'}`)
      }
    } catch (err) {
      appendLog(`[错误] 操作失败: ${err}`)
    } finally {
      isLoading.value = false
      await refreshStatus()
    }
  }

  async function executeApply(autoClose: boolean) {
    await executeAction(
      () => ApplyPatch(currentPath.value, autoClose),
      '汉化完成',
      '汉化失败'
    )
  }

  async function executeRestore(autoClose: boolean) {
    await executeAction(
      () => RestoreOriginal(currentPath.value, autoClose),
      '已还原为英文原版',
      '还原失败'
    )
  }

  async function handleApply() {
    if (!currentStatus.value.asarExists) {
      showToast('请先选择 app.asar 文件')
      return
    }

    if (currentStatus.value.isRunning) {
      pendingAction.value = 'apply'
      showConflictModal.value = true
      return
    }

    await executeApply(false)
  }

  async function handleRestore() {
    if (!currentStatus.value.asarExists) {
      showToast('请先选择 app.asar 文件')
      return
    }

    if (!currentStatus.value.backupExists) {
      showToast('未找到备份文件，无法还原')
      return
    }

    if (currentStatus.value.isRunning) {
      pendingAction.value = 'restore'
      showConflictModal.value = true
      return
    }

    await executeRestore(false)
  }

  async function handleLaunch() {
    try {
      const res = await LaunchAntigravity(currentPath.value)
      if (res.success) {
        showToast('已启动 Antigravity')
      } else {
        showToast(`启动失败: ${res.message}`)
      }
      setTimeout(() => refreshStatus(), 1500)
    } catch (err) {
      appendLog(`[错误] 启动 Antigravity 失败: ${err}`)
    }
  }

  async function handleCleanCache() {
    await executeAction(
      () => CleanAppCache(),
      '缓存已清理',
      '清理缓存失败'
    )
  }

  function handleCancelConflict() {
    showConflictModal.value = false
    appendLog('[提示] 操作已取消（应用正在运行）')
    pendingAction.value = null
  }

  async function handleConfirmConflictAutoClose() {
    showConflictModal.value = false
    const action = pendingAction.value
    pendingAction.value = null

    if (action === 'apply') {
      await executeApply(true)
    } else if (action === 'restore') {
      await executeRestore(true)
    }
  }

  function openExternalUrl(url = GITHUB_REPO_URL) {
    try {
      if (typeof BrowserOpenURL === 'function') {
        BrowserOpenURL(url)
      } else if (typeof OpenURL === 'function') {
        OpenURL(url)
      } else {
        window.open(url, '_blank')
      }
      showToast('已在浏览器中打开链接')
    } catch {
      window.open(url, '_blank')
    }
  }

  return {
    currentPath,
    currentStatus,
    isLoading,
    showConflictModal,
    pendingAction,
    loadInitialState,
    refreshStatus,
    browsePath,
    handleApply,
    handleRestore,
    handleLaunch,
    handleCleanCache,
    handleCancelConflict,
    handleConfirmConflictAutoClose,
    openExternalUrl,
    GITHUB_REPO_URL
  }
}
