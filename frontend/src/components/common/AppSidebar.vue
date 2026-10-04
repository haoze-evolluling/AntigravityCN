<script setup lang="ts">
import type { NavTab } from '@/types'
import { useAntigravity } from '@/composables/useAntigravity'
import { useTheme } from '@/composables/useTheme'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIcon from '@/components/md3/MdIcon.vue'
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
            <MdIcon name="translate" :size="20" />
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
            <MdIcon name="settings" :size="20" />
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
          <MdIcon name="dark_mode" :size="16" filled />
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
        <MdIcon name="arrow_outward" :size="14" style="opacity: 0.6;" />
      </button>
    </div>
  </aside>
</template>
