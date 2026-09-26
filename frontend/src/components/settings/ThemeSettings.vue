<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/types'

const { currentThemeMode, themeNames, setThemeMode } = useTheme()

const themes: { id: ThemeMode; name: string; detail: string; icon: string }[] = [
  {
    id: 'system',
    name: '跟随系统',
    detail: '随操作系统色彩自动适配',
    icon: 'system'
  },
  {
    id: 'light',
    name: '浅色 · 素宣',
    detail: '温润生宣米白，水墨分明',
    icon: 'light'
  },
  {
    id: 'dark',
    name: '深色 · 玄青',
    detail: '松烟古砚沉邃，朱印点翠',
    icon: 'dark'
  }
]
</script>

<template>
  <section class="paper-card settings-card">
    <div class="section-meta-header">
      <div class="section-title-wrap">
        <h3 class="card-title">外观主题模式</h3>
        <p class="card-subtitle">选择符合视觉意境的主题风格，支持即时渲染与持久化保存</p>
      </div>
      <div class="seal-badge">{{ themeNames[currentThemeMode] }}</div>
    </div>

    <div class="theme-options-grid">
      <div
        v-for="item in themes"
        :key="item.id"
        class="theme-option-card"
        :class="{ active: currentThemeMode === item.id }"
        @click="setThemeMode(item.id, true)"
      >
        <div class="theme-card-header">
          <div class="theme-card-icon" :class="`${item.id}-icon`">
            <!-- System Icon -->
            <svg
              v-if="item.id === 'system'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <!-- Light Icon -->
            <svg
              v-else-if="item.id === 'light'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <!-- Dark Icon -->
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          <div class="theme-seal-check">
            <span class="seal-dot"></span>
          </div>
        </div>
        <div class="theme-card-info">
          <span class="theme-name">{{ item.name }}</span>
          <span class="theme-detail">{{ item.detail }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
