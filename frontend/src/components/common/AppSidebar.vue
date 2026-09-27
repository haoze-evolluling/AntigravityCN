<script setup lang="ts">
import type { NavTab } from '@/types'
import { useAntigravity } from '@/composables/useAntigravity'
import { useTheme } from '@/composables/useTheme'
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
  <aside class="sidebar" style="--wails-draggable:drag">
    <!-- Brand Info Header -->
    <div>
      <div class="sidebar-header">
        <div class="brand-logo-wrap">
          <img :src="logoUrl" alt="AntigravityCN" />
        </div>
        <div class="brand-info">
          <span class="brand-title">AntigravityCN</span>
          <div class="brand-subtitle-row">
            <span class="brand-subtitle">简体中文汉化</span>
            <span class="badge-pill">v3.0</span>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav" style="--wails-draggable:no-drag">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'dashboard' }"
          title="汉化中枢与核心操作"
          @click="emit('update:activeTab', 'dashboard')"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h13.5A2.25 2.25 0 0 0 19 13.75v-7.5A2.25 2.25 0 0 0 16.75 4H3.25ZM2.5 6.25c0-.414.336-.75.75-.75h13.5c.414 0 .75.336.75.75v7.5c0 .414-.336.75-.75.75H3.25a.75.75 0 0 1-.75-.75v-7.5Z"
              />
              <path
                d="M4.75 8a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5ZM4.75 11.5a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z"
              />
            </svg>
          </div>
          <span class="nav-title">汉化控制台</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activeTab === 'settings' }"
          title="外观偏好与项目信息"
          @click="emit('update:activeTab', 'settings')"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fill-rule="evenodd"
                d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <span class="nav-title">偏好与关于</span>
        </button>
      </nav>
    </div>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer" style="--wails-draggable:no-drag">
      <button class="footer-btn" title="快捷切换界面外观模式" @click="toggleQuickTheme">
        <span style="display: flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path
              d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
            />
          </svg>
          <span>外观主题</span>
        </span>
        <span class="badge-pill" style="font-size: 9px;">
          {{ currentThemeMode === 'dark' ? '深色' : currentThemeMode === 'light' ? '浅色' : '系统' }}
        </span>
      </button>

      <button class="footer-btn" title="访问 GitHub 开源项目仓库" @click="openExternalUrl()">
        <span style="display: flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
            />
          </svg>
          <span>开源社区</span>
        </span>
        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
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
