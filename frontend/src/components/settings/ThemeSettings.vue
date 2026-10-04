<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/types'

const { currentThemeMode, themeNames, setThemeMode } = useTheme()

const themes: { id: ThemeMode; name: string; detail: string }[] = [
  {
    id: 'system',
    name: '跟随系统',
    detail: '自动匹配系统深浅色设置'
  },
  {
    id: 'light',
    name: '浅色模式',
    detail: '明亮清爽的浅色界面'
  },
  {
    id: 'dark',
    name: '深色模式',
    detail: '适合暗光环境的深色界面'
  }
]
</script>

<template>
  <section class="card">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path
              d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
            />
          </svg>
        </div>
        <div>
          <h3 class="card-title">外观主题</h3>
          <p class="card-subtitle">选择界面的深浅显示模式</p>
        </div>
      </div>
      <span class="badge-pill">
        当前：{{ themeNames[currentThemeMode] }}
      </span>
    </div>

    <!-- 3 Equal Columns Theme Selector -->
    <div class="theme-grid">
      <div
        v-for="item in themes"
        :key="item.id"
        class="theme-card"
        :class="{ active: currentThemeMode === item.id }"
        @click="setThemeMode(item.id, true)"
      >
        <div class="theme-card-top">
          <div class="theme-icon-wrap">
            <!-- System Icon -->
            <svg
              v-if="item.id === 'system'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="18"
              height="18"
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
              width="18"
              height="18"
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
              width="18"
              height="18"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>

          <div class="theme-radio">
            <span class="theme-radio-inner"></span>
          </div>
        </div>

        <div>
          <div class="theme-card-title">{{ item.name }}</div>
          <div class="theme-card-desc">{{ item.detail }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
