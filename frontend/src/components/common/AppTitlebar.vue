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
  <header class="titlebar" style="--wails-draggable:drag">
    <!-- Breadcrumb & Page Info -->
    <div class="titlebar-left" style="--wails-draggable:no-drag">
      <div class="page-breadcrumb">
        <span>{{ activeTab === 'dashboard' ? '汉化' : '设置' }}</span>
        <span class="page-breadcrumb-sub">·</span>
        <span class="page-breadcrumb-sub">
          {{ activeTab === 'dashboard' ? '操作与日志' : '外观与关于' }}
        </span>
      </div>
    </div>

    <!-- Draggable Center Zone -->
    <div class="titlebar-center"></div>

    <!-- Window Controls -->
    <div class="titlebar-right" style="--wails-draggable:no-drag">
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
