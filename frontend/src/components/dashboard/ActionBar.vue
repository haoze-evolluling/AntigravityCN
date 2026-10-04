<script setup lang="ts">
import { useAntigravity } from '@/composables/useAntigravity'
import MdButton from '@/components/md3/MdButton.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

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
        <MdIcon name="translate" :size="18" />
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
        <MdIcon name="settings_backup_restore" :size="18" />
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
        <MdIcon name="rocket_launch" :size="18" filled />
      </template>
      启动 Antigravity
    </MdButton>
  </section>
</template>
