<script setup lang="ts">
import { useAntigravity } from '@/composables/useAntigravity'

const {
  isLoading,
  handleApply,
  handleRestore,
  handleLaunch
} = useAntigravity()
</script>

<template>
  <section class="actions-container">
    <button
      class="btn btn-primary"
      :disabled="isLoading"
      title="一键将简体中文汉化语言包安全写入"
      @click="handleApply"
    >
      <div class="btn-ink-shimmer"></div>
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path
          fill-rule="evenodd"
          d="M11.3 1.046A1 1 0 0 1 12 2v5h4a1 1 0 0 1 .82 1.573l-7 10A1 1 0 0 1 8 18v-5H4a1 1 0 0 1-.82-1.573l7-10a1 1 0 0 1 1.12-.38Z"
          clip-rule="evenodd"
        />
      </svg>
      <span>一键安装汉化</span>
    </button>

    <button
      class="btn btn-inkstone"
      :disabled="isLoading"
      title="从备份文件完整还原官方纯英文原版"
      @click="handleRestore"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path
          fill-rule="evenodd"
          d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.061.025Z"
          clip-rule="evenodd"
        />
      </svg>
      <span>还原英文原版</span>
    </button>

    <button
      class="btn btn-pine"
      :disabled="isLoading"
      title="启动已安装的 Google Antigravity 客户端"
      @click="handleLaunch"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path
          d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z"
        />
      </svg>
      <span>启动 Antigravity</span>
    </button>
  </section>
</template>
