<script setup lang="ts">
import type { NavTab } from '@/types'
import { WindowMinimise, Quit } from '@/../wailsjs/runtime'
import MdIcon from '@/components/md3/MdIcon.vue'

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
        <MdIcon name="minimize" :size="14" :weight="500" />
      </button>
      <button class="window-ctrl-btn close-btn" title="关闭" @click="closeWindow">
        <MdIcon name="close" :size="16" :weight="500" />
      </button>
    </div>
  </header>
</template>
