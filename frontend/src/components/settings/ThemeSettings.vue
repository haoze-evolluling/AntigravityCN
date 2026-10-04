<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/types'
import MdCard from '@/components/md3/MdCard.vue'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

const { currentThemeMode, themeNames, setThemeMode } = useTheme()

const themes: { id: ThemeMode; name: string; detail: string; icon: string }[] = [
  {
    id: 'system',
    name: '跟随系统',
    detail: '自动同步并匹配操作系统深浅色设置',
    icon: 'desktop_windows'
  },
  {
    id: 'light',
    name: '浅色模式',
    detail: '明亮通透的 Material 3 浅色工作界面',
    icon: 'light_mode'
  },
  {
    id: 'dark',
    name: '深色模式',
    detail: '沉浸舒适的夜间模式，与系统云母材质深度融合',
    icon: 'dark_mode'
  }
]
</script>

<template>
  <MdCard variant="outlined">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-icon">
          <MdIcon name="palette" :size="20" />
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
    <div class="theme-grid" role="radiogroup" aria-label="外观主题">
      <button
        v-for="item in themes"
        :key="item.id"
        v-ripple
        type="button"
        class="theme-card md-state-layer"
        :class="{ active: currentThemeMode === item.id }"
        role="radio"
        :aria-checked="currentThemeMode === item.id"
        @click="setThemeMode(item.id, true)"
      >
        <div class="theme-card-top">
          <div class="theme-icon-wrap">
            <MdIcon :name="item.icon" :size="20" />
          </div>

          <div class="theme-radio">
            <span class="theme-radio-inner"></span>
          </div>
        </div>

        <div>
          <div class="theme-card-title">{{ item.name }}</div>
          <div class="theme-card-desc">{{ item.detail }}</div>
        </div>
      </button>
    </div>
  </MdCard>
</template>
