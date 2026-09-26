import { ref } from 'vue'
import type { ThemeMode } from '@/types'
import { useToast } from './useToast'

const currentThemeMode = ref<ThemeMode>('system')
const effectiveTheme = ref<'light' | 'dark'>('dark')

const themeNames: Record<ThemeMode, string> = {
  system: '跟随系统',
  light: '浅色 · 素宣',
  dark: '深色 · 玄青'
}

export function useTheme() {
  const { showToast } = useToast()

  function applyThemeToDOM(mode: ThemeMode) {
    const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches
    let theme: 'light' | 'dark' = 'dark'

    if (mode === 'system') {
      theme = isDarkOS ? 'dark' : 'light'
    } else {
      theme = mode
    }

    effectiveTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
  }

  function setThemeMode(mode: ThemeMode, showFeedback = true) {
    if (!['system', 'light', 'dark'].includes(mode)) {
      mode = 'system'
    }

    currentThemeMode.value = mode
    localStorage.setItem('antigravity_theme', mode)

    applyThemeToDOM(mode)

    // Synchronize native window theme if Wails runtime supports it
    if (window.runtime) {
      try {
        if (mode === 'light' && window.runtime.WindowSetLightTheme) {
          window.runtime.WindowSetLightTheme()
        } else if (mode === 'dark' && window.runtime.WindowSetDarkTheme) {
          window.runtime.WindowSetDarkTheme()
        } else if (mode === 'system' && window.runtime.WindowSetSystemDefaultTheme) {
          window.runtime.WindowSetSystemDefaultTheme()
        }
      } catch (e) {
        console.debug('Wails window theme API call ignored:', e)
      }
    }

    if (showFeedback) {
      showToast(`已切换为【${themeNames[mode]}】`)
    }
  }

  function initTheme() {
    const savedTheme = (localStorage.getItem('antigravity_theme') as ThemeMode) || 'system'
    setThemeMode(savedTheme, false)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (currentThemeMode.value === 'system') {
        applyThemeToDOM('system')
      }
    })
  }

  return {
    currentThemeMode,
    effectiveTheme,
    themeNames,
    setThemeMode,
    initTheme
  }
}
