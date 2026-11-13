<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { NavTab } from '@/types'
import {
  WindowIsMaximised,
  WindowMinimise,
  WindowToggleMaximise,
  Quit
} from '@/../wailsjs/runtime'
import MdIcon from '@/components/md3/MdIcon.vue'

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
        <MdIcon name="minimize" :size="14" :weight="500" />
      </button>
      <button
        class="window-ctrl-btn"
        :title="isMaximised ? '还原窗口' : '最大化'"
        @click="toggleMaximiseWindow"
      >
        <MdIcon v-if="isMaximised" name="restore" :size="14" :weight="500" />
        <MdIcon v-else name="maximize" :size="14" :weight="500" />
      </button>
      <button class="window-ctrl-btn close-btn" title="关闭" @click="closeWindow">
        <MdIcon name="close" :size="16" :weight="500" />
      </button>
    </div>
  </header>
</template>
