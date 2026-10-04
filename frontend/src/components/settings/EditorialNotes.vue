<script setup lang="ts">
import MdCard from '@/components/md3/MdCard.vue'
import MdIcon from '@/components/md3/MdIcon.vue'
</script>

<template>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
    <!-- Safety Feature 1: Auto Backup -->
    <MdCard variant="outlined" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px;">
      <div class="status-icon-box ok" style="width: 36px; height: 36px;">
        <MdIcon name="lock" :size="20" filled />
      </div>
      <div style="display: flex; flex-direction: column; gap: 3px;">
        <span style="font: var(--md-sys-typescale-title-small); color: var(--md-sys-color-on-surface);">
          安全自动备份
        </span>
        <span style="font: var(--md-sys-typescale-body-small); color: var(--md-sys-color-on-surface-variant); line-height: 1.5;">
          首次安装汉化时，会自动在同目录下生成 <code style="color: var(--md-sys-color-primary);">app.asar.backup</code> 官方原始备份。
        </span>
      </div>
    </MdCard>

    <!-- Safety Feature 2: One-click Restore -->
    <MdCard variant="outlined" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px;">
      <div class="status-icon-box ok" style="width: 36px; height: 36px;">
        <MdIcon name="settings_backup_restore" :size="20" filled />
      </div>
      <div style="display: flex; flex-direction: column; gap: 3px;">
        <span style="font: var(--md-sys-typescale-title-small); color: var(--md-sys-color-on-surface);">
          无损原版还原
        </span>
        <span style="font: var(--md-sys-typescale-body-small); color: var(--md-sys-color-on-surface-variant); line-height: 1.5;">
          随时点击“还原英文原版”，即可秒级还原至未经任何修改的官方英文原始程序。
        </span>
      </div>
    </MdCard>
  </div>
</template>
