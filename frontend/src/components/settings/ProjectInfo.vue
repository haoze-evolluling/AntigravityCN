<script setup lang="ts">
import { useAntigravity } from '@/composables/useAntigravity'
import MdCard from '@/components/md3/MdCard.vue'
import MdButton from '@/components/md3/MdButton.vue'
import MdBadge from '@/components/md3/MdBadge.vue'

const { openExternalUrl, GITHUB_REPO_URL } = useAntigravity()
</script>

<template>
  <MdCard variant="outlined">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
            />
          </svg>
        </div>
        <div>
          <h3 class="card-title">关于项目</h3>
          <p class="card-subtitle">遵循 MIT 开源许可协议，欢迎提出建议与 Issue</p>
        </div>
      </div>
      <MdBadge>MIT 协议</MdBadge>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 6px;">
      <div style="display: flex; flex-direction: column; gap: 6px; overflow: hidden;">
        <span style="font: var(--md-sys-typescale-title-small); color: var(--md-sys-color-on-surface);">
          haoze-evolluling / AntigravityCN
        </span>
        <span style="font: var(--md-sys-typescale-body-small); color: var(--md-sys-color-on-surface-variant); line-height: 1.5;">
          Google Antigravity 简体中文汉化工具，基于 Material Design 3 全新架构设计，支持路径自动探索与无损还原。
        </span>
        <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-family: var(--md-ref-typeface-mono); color: var(--md-sys-color-primary);">
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
            <path
              d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z"
            />
            <path
              d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z"
            />
          </svg>
          <span>{{ GITHUB_REPO_URL }}</span>
        </div>
      </div>

      <MdButton
        variant="tonal"
        style="padding: 0 16px; flex-shrink: 0;"
        title="在默认浏览器中打开 GitHub 仓库"
        @click="openExternalUrl()"
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
            />
          </svg>
        </template>
        访问 GitHub
      </MdButton>
    </div>
  </MdCard>
</template>
