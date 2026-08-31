export interface AppState {
  asarPath: string
  asarExists: boolean
  backupExists: boolean
  isRunning: boolean
}

export interface ActionResult {
  success: boolean
  message: string
}

export type ThemeMode = 'system' | 'light' | 'dark'

export type LogType = 'system' | 'info' | 'success' | 'warn' | 'error' | 'divider'

export interface LogItem {
  id: number
  time: string
  text: string
  type: LogType
}

export type PendingAction = 'apply' | 'restore' | null

export type NavTab = 'dashboard' | 'settings'
