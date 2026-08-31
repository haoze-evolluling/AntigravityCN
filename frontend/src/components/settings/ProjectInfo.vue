<script setup lang="ts">
import { useAntigravity } from '@/composables/useAntigravity'

const { openExternalUrl, GITHUB_REPO_URL } = useAntigravity()
</script>

<template>
  <section class="paper-card settings-card project-card">
    <div class="section-meta-header">
      <div class="section-title-wrap">
        <h3 class="card-title">开源项目与社区</h3>
        <p class="card-subtitle">基于开源生态构建，致力于提供优雅、安全的本地汉化体验</p>
      </div>
      <div class="seal-badge">开源协议 · MIT</div>
    </div>

    <div class="project-info-layout">
      <div class="project-details">
        <div class="project-repo-title">haoze-evolluling / AntigravityCN</div>
        <p class="project-summary">
          Google Antigravity 客户端全方位简体中文深度汉化工具，提供现代化桌面交互、智能路径嗅探与无损备份还原引擎。
        </p>
        <div class="project-url-badge">
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
      <div class="project-action-col">
        <button class="btn btn-primary github-btn" @click="openExternalUrl()">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
            />
          </svg>
          <span>访问开源仓库</span>
        </button>
      </div>
    </div>
  </section>
</template>
