<script setup lang="ts">
import type { NavTab } from '@/types'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIcon from '@/components/md3/MdIcon.vue'
import logoUrl from '@/assets/logo.svg'

defineProps<{
  activeTab: NavTab
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: NavTab): void
}>()
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
            <MdBadge class="version-badge">v4.0</MdBadge>
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
  </aside>
</template>
