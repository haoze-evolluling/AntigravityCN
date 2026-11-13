<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { NavTab } from '@/types'
import {
  WindowIsMaximised,
  WindowMinimise,
  WindowToggleMaximise,
  Quit
} from '@/../wailsjs/runtime'

defineProps<{
  activeTab: NavTab
}>()

const isMaximised = ref(false)

function minimizeWindow() {
  if (typeof WindowMinimise === 'function') {
    WindowMinimise()
  } else if (window.runtime?.WindowMinimise) {
    window.runtime.WindowMinimise()
  }
}

async function syncMaximisedState() {
  if (typeof WindowIsMaximised === 'function') {
    try {
      isMaximised.value = await WindowIsMaximised()
    } catch {
      isMaximised.value = false
    }
  }
}

function toggleMaximiseWindow() {
  if (typeof WindowToggleMaximise === 'function') {
    WindowToggleMaximise()
  } else if (window.runtime?.WindowToggleMaximise) {
    window.runtime.WindowToggleMaximise()
  }
  window.setTimeout(syncMaximisedState, 120)
}

function closeWindow() {
  if (typeof Quit === 'function') {
    Quit()
  } else if (window.runtime?.Quit) {
    window.runtime.Quit()
  }
}

onMounted(() => {
  syncMaximisedState()
  window.addEventListener('resize', syncMaximisedState)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncMaximisedState)
})
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
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8.5h10" />
        </svg>
      </button>
      <button
        class="window-ctrl-btn"
        :title="isMaximised ? '还原窗口' : '最大化'"
        @click="toggleMaximiseWindow"
      >
        <svg v-if="isMaximised" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5.5 3.5h7v7h-2" />
          <rect x="3.5" y="5.5" width="7" height="7" rx="0.6" />
        </svg>
        <svg v-else viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3.5" y="3.5" width="9" height="9" rx="0.6" />
        </svg>
      </button>
      <button class="window-ctrl-btn close-btn" title="关闭" @click="closeWindow">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 4 8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  </header>
</template>
