<script setup lang="ts">
import type { NavTab } from '@/types'
import { useAntigravity } from '@/composables/useAntigravity'
import { useTheme } from '@/composables/useTheme'
import MdBadge from '@/components/md3/MdBadge.vue'
import logoUrl from '@/assets/logo.svg'

defineProps<{
  activeTab: NavTab
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: NavTab): void
}>()

const { openExternalUrl } = useAntigravity()
const { currentThemeMode, setThemeMode } = useTheme()

function toggleQuickTheme() {
  if (currentThemeMode.value === 'dark') {
    setThemeMode('light', true)
  } else if (currentThemeMode.value === 'light') {
    setThemeMode('system', true)
  } else {
    setThemeMode('dark', true)
  }
}
</script>

<template>
  <aside class="md-navigation-drawer" style="--wails-draggable:drag">
    <!-- Brand Info Header -->
    <div>
      <div class="drawer-header">
        <div class="brand-logo-wrap">
          <img :src="logoUrl" alt="AntigravityCN" />
        </div>
        <div class="brand-info">
          <span class="brand-title">AntigravityCN</span>
          <div class="brand-subtitle-row">
            <span class="brand-subtitle">汉化工具</span>
            <MdBadge style="font-size: 9.5px; padding: 1px 7px;">v3.0</MdBadge>
          </div>
        </div>
      </div>

      <!-- M3 Navigation Links -->
      <nav class="drawer-nav" style="--wails-draggable:no-drag">
        <button
          v-ripple
          type="button"
          class="drawer-nav-item"
          :class="{ active: activeTab === 'dashboard' }"
          :aria-current="activeTab === 'dashboard' ? 'page' : undefined"
          title="汉化管理"
          @click="emit('update:activeTab', 'dashboard')"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path
                d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm2 0v12h12V6H6Zm2 2h8v2H8V8Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z"
              />
            </svg>
          </div>
          <span class="nav-title">汉化</span>
        </button>

        <button
          v-ripple
          type="button"
          class="drawer-nav-item"
          :class="{ active: activeTab === 'settings' }"
          :aria-current="activeTab === 'settings' ? 'page' : undefined"
          title="偏好设置"
          @click="emit('update:activeTab', 'settings')"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path
                fill-rule="evenodd"
                d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z"
                clip-rule="evenodd"
              />
              <path
                fill-rule="evenodd"
                d="M9.82 2.1a1.5 1.5 0 0 1 1.48-1.1h1.4a1.5 1.5 0 0 1 1.48 1.1l.36 1.44a7.96 7.96 0 0 1 1.76.73l1.32-.76a1.5 1.5 0 0 1 1.84.28l.99.99a1.5 1.5 0 0 1 .28 1.84l-.76 1.32c.3.56.54 1.15.73 1.76l1.44.36a1.5 1.5 0 0 1 1.1 1.48v1.4a1.5 1.5 0 0 1-1.1 1.48l-1.44.36a7.96 7.96 0 0 1-.73 1.76l.76 1.32a1.5 1.5 0 0 1-.28 1.84l-.99.99a1.5 1.5 0 0 1-1.84.28l-1.32-.76c-.56.3-1.15.54-1.76.73l-.36 1.44a1.5 1.5 0 0 1-1.48 1.1h-1.4a1.5 1.5 0 0 1-1.48-1.1l-.36-1.44a7.96 7.96 0 0 1-1.76-.73l-1.32.76a1.5 1.5 0 0 1-1.84-.28l-.99-.99a1.5 1.5 0 0 1-.28-1.84l.76-1.32a7.96 7.96 0 0 1-.73-1.76l-1.44-.36A1.5 1.5 0 0 1 1 13.42v-1.4a1.5 1.5 0 0 1 1.1-1.48l1.44-.36c.19-.61.43-1.2.73-1.76l-.76-1.32a1.5 1.5 0 0 1 .28-1.84l.99-.99a1.5 1.5 0 0 1 1.84-.28l1.32.76c.56-.3 1.15-.54 1.76-.73l.36-1.44ZM12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <span class="nav-title">设置</span>
        </button>
      </nav>
    </div>

    <!-- Drawer Footer -->
    <div class="drawer-footer" style="--wails-draggable:no-drag">
      <button
        v-ripple
        type="button"
        class="drawer-footer-btn md-state-layer"
        title="快速切换界面外观主题"
        @click="toggleQuickTheme"
      >
        <span style="display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path
              d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9.006 9.006 0 0 0 12 3Z"
            />
          </svg>
          <span>主题</span>
        </span>
        <MdBadge style="font-size: 9.5px; padding: 1px 7px;">
          {{ currentThemeMode === 'dark' ? '深色' : currentThemeMode === 'light' ? '浅色' : '系统' }}
        </MdBadge>
      </button>

      <button
        v-ripple
        type="button"
        class="drawer-footer-btn md-state-layer"
        title="打开 GitHub 开源仓库"
        @click="openExternalUrl()"
      >
        <span style="display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
            />
          </svg>
          <span>GitHub</span>
        </span>
        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" style="opacity: 0.6;">
          <path
            fill-rule="evenodd"
            d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </aside>
</template>
