<script setup lang="ts">
import type { NavTab } from '@/types'
import { WindowMinimise, Quit } from '@/../wailsjs/runtime'

defineProps<{
  activeTab: NavTab
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
  <header class="top-app-bar" style="--wails-draggable:drag">
    <!-- Breadcrumb & Page Info -->
    <div class="top-app-bar-left" style="--wails-draggable:no-drag">
      <div class="page-breadcrumb">
        <span>{{ activeTab === 'dashboard' ? '汉化' : '设置' }}</span>
        <span class="page-breadcrumb-sub">·</span>
        <span class="page-breadcrumb-sub">
          {{ activeTab === 'dashboard' ? '操作面板与运行日志' : '外观主题与项目信息' }}
        </span>
      </div>
    </div>

    <!-- Draggable Center Zone -->
    <div class="top-app-bar-center"></div>

    <!-- Window Controls -->
    <div class="top-app-bar-right" style="--wails-draggable:no-drag">
      <button class="window-ctrl-btn" title="最小化" @click="minimizeWindow">
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path fill="currentColor" d="M2 8h12v1.5H2z" />
        </svg>
      </button>
      <button class="window-ctrl-btn close-btn" title="关闭" @click="closeWindow">
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path
            fill="currentColor"
            d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>
    </div>
  </header>
</template>
