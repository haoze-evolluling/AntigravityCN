<script setup lang="ts">
import MdCard from '@/components/md3/MdCard.vue'
</script>

<template>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
    <!-- Safety Feature 1: Auto Backup -->
    <MdCard variant="outlined" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px;">
      <div class="status-icon-box ok" style="width: 36px; height: 36px;">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path
            fill-rule="evenodd"
            d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8V7a3 3 0 0 0-6 0v3h6Z"
            clip-rule="evenodd"
          />
        </svg>
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
        <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
          <path
            fill-rule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.096l.487.487a7 7 0 0 0 11.83-3.07.75.75 0 0 0-1.255-.476ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311H11.75a.75.75 0 0 0 0 1.5H15.5a.75.75 0 0 0 .75-.75V3.421a.75.75 0 0 0-1.5 0v2.096l-.487-.487a7 7 0 0 0-11.83 3.07.75.75 0 0 0 1.255.476Z"
            clip-rule="evenodd"
          />
        </svg>
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
