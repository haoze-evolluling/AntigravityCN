<script setup lang="ts">
import type { NavTab } from '@/types'
import { WindowMinimise, Quit } from '@/../wailsjs/runtime'
import logoUrl from '@/assets/logo.svg'

defineProps<{
  activeTab: NavTab
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: NavTab): void
}>()

function minimizeWindow() {
  if (typeof WindowMinimise === 'function') {
    WindowMinimise()
  } else if (window.runtime?.WindowMinimise) {
    window.runtime.WindowMinimise()
  }
}

function closeWindow() {
  if (typeof Quit === 'function') {
    Quit()
  } else if (window.runtime?.Quit) {
    window.runtime.Quit()
  }
}
</script>

<template>
  <header class="titlebar" style="--wails-draggable:drag">
    <div class="brand">
      <div class="logo-icon">
        <img :src="logoUrl" alt="AntigravityCN" class="logo-img" width="22" height="22" />
      </div>
      <div class="brand-text">
        <span class="title">AntigravityCN</span>
        <span class="editorial-sep">/</span>
        <span class="title-sub">简体中文汉化</span>
      </div>
      <div class="seal-badge">便携版 · v2.5</div>
    </div>

    <!-- Titlebar Tabs & Window Controls -->
    <div class="titlebar-right" style="--wails-draggable:no-drag">
      <nav class="titlebar-tabs">
        <button
          class="tab-item"
          :class="{ active: activeTab === 'dashboard' }"
          title="汉化主控制台"
          @click="emit('update:activeTab', 'dashboard')"
        >
          <span class="tab-index">01</span>
          <span>汉化中枢</span>
        </button>
        <button
          class="tab-item"
          :class="{ active: activeTab === 'settings' }"
          title="软件设置与偏好"
          @click="emit('update:activeTab', 'settings')"
        >
          <span class="tab-index">02</span>
          <span>偏好设置</span>
        </button>
      </nav>
      <div class="titlebar-divider"></div>
      <div class="window-controls">
        <button class="ctrl-btn" title="最小化" @click="minimizeWindow">
          <svg viewBox="0 0 16 16" width="11" height="11">
            <path fill="currentColor" d="M2 8h12v1.2H2z" />
          </svg>
        </button>
        <button class="ctrl-btn close-btn" title="关闭" @click="closeWindow">
          <svg viewBox="0 0 16 16" width="11" height="11">
            <path
              fill="currentColor"
              d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
