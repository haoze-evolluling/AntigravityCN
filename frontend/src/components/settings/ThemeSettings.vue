<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/types'
import MdCard from '@/components/md3/MdCard.vue'
import MdBadge from '@/components/md3/MdBadge.vue'

const { currentThemeMode, themeNames, setThemeMode } = useTheme()

const themes: { id: ThemeMode; name: string; detail: string }[] = [
  {
    id: 'system',
    name: '跟随系统',
    detail: '自动同步并匹配操作系统深浅色设置'
  },
  {
    id: 'light',
    name: '浅色模式',
    detail: '明亮通透的 Material 3 浅色工作界面'
  },
  {
    id: 'dark',
    name: '深色模式',
    detail: '沉浸舒适的夜间模式，与系统云母材质深度融合'
  }
]
</script>

<template>
  <MdCard variant="outlined">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path
              d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9.006 9.006 0 0 0 12 3Z"
            />
          </svg>
        </div>
        <div>
          <h3 class="card-title">外观主题</h3>
          <p class="card-subtitle">选择 Material Design 3 的色彩与深浅模式</p>
        </div>
      </div>
      <MdBadge>
        当前：{{ themeNames[currentThemeMode] }}
      </MdBadge>
    </div>

    <!-- 3 Columns Theme Selector Grid -->
    <div class="theme-grid">
      <div
        v-for="item in themes"
        :key="item.id"
        v-ripple
        class="theme-card md-state-layer"
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
              width="20"
              height="20"
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
              width="20"
              height="20"
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
              width="20"
              height="20"
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
  </MdCard>
</template>
