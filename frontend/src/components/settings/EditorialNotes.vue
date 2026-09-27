<script setup lang="ts"></script>

<template>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
    <!-- Safety Feature 1 -->
    <div class="card" style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;">
      <div class="status-icon-box ok" style="width: 32px; height: 32px;">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path
            fill-rule="evenodd"
            d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
          自动原版备份机制
        </span>
        <span style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
          首次执行汉化写入前，系统会自动在同级目录生成 <code style="color: var(--primary);">app.asar.backup</code> 纯净备份文件。
        </span>
      </div>
    </div>

    <!-- Safety Feature 2 -->
    <div class="card" style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;">
      <div class="status-icon-box ok" style="width: 32px; height: 32px;">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path
            fill-rule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.451a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 0 1.5 0v-2.096l.487.487a7 7 0 0 0 11.83-3.07.75.75 0 0 0 1.255-.476ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311H11.75a.75.75 0 0 0 0 1.5H15.5a.75.75 0 0 0 .75-.75V3.421a.75.75 0 0 0-1.5 0v2.096l-.487-.487a7 7 0 0 0-11.83 3.07.75.75 0 0 0 1.255.476Z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
          无损一键还原保障
        </span>
        <span style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
          随时可通过「还原英文原版」完整恢复官方原版二进制与文件哈希，无任何残留或数据损失。
        </span>
      </div>
    </div>
  </div>
</template>
