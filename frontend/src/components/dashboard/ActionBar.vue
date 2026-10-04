<script setup lang="ts">
import { useAntigravity } from '@/composables/useAntigravity'
import MdButton from '@/components/md3/MdButton.vue'

const {
  isLoading,
  handleApply,
  handleRestore,
  handleLaunch
} = useAntigravity()
</script>

<template>
  <section class="actions-grid">
    <!-- Primary Action: Apply Patch (M3 Filled Button) -->
    <MdButton
      variant="filled"
      class="btn-action"
      :disabled="isLoading"
      :loading="isLoading"
      title="安装简体中文汉化补丁"
      @click="handleApply"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="m11 21-1-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6l-2 4Zm1.5-6H19V5H5v10h7.5ZM9.5 7h5v1.5h-5V7Zm0 3h5v1.5h-5V10Z" />
        </svg>
      </template>
      安装汉化
    </MdButton>

    <!-- Secondary Action: Restore Backup (M3 Outlined Button) -->
    <MdButton
      variant="outlined"
      class="btn-action"
      :disabled="isLoading"
      title="从备份还原为官方英文原版"
      @click="handleRestore"
    >
      <template #icon>
        <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
          <path
            fill-rule="evenodd"
            d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.061.025Z"
            clip-rule="evenodd"
          />
        </svg>
      </template>
      还原英文原版
    </MdButton>

    <!-- Accent Launch Action (M3 Tertiary Button) -->
    <MdButton
      variant="tertiary"
      class="btn-action"
      :disabled="isLoading"
      title="启动 Antigravity 主程序"
      @click="handleLaunch"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 2.5a.75.75 0 0 1 .75.75v1.25a7.99 7.99 0 0 1 6.75 6.75h1.25a.75.75 0 0 1 0 1.5h-1.25a7.99 7.99 0 0 1-6.75 6.75v1.25a.75.75 0 0 1-1.5 0v-1.25a7.99 7.99 0 0 1-6.75-6.75H3.25a.75.75 0 0 1 0-1.5h1.25a7.99 7.99 0 0 1 6.75-6.75V3.25a.75.75 0 0 1 .75-.75Zm0 4.25a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm-2 3.5 5 3.25-5 3.25V10.25Z" />
        </svg>
      </template>
      启动 Antigravity
    </MdButton>
  </section>
</template>
