<script setup lang="ts">
import { useAntigravity } from '@/composables/useAntigravity'
import MdCard from '@/components/md3/MdCard.vue'
import MdButton from '@/components/md3/MdButton.vue'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

const { openExternalUrl, GITHUB_REPO_URL } = useAntigravity()
</script>

<template>
  <MdCard variant="outlined" class="help-about-card">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-icon">
          <MdIcon name="info" :size="20" />
        </div>
        <div>
          <h3 class="card-title">数据安全与项目信息</h3>
          <p class="card-subtitle">汉化过程可逆，并会自动保留官方原版文件</p>
        </div>
      </div>
      <MdBadge>MIT 协议</MdBadge>
    </div>

    <div class="info-list">
      <div class="info-row">
        <div class="status-icon-box ok">
          <MdIcon name="lock" :size="20" filled />
        </div>
        <div class="info-row-copy">
          <strong>安全自动备份</strong>
          <p>
            首次安装汉化时，会自动在同目录下生成
            <code>app.asar.backup</code> 官方原始备份。
          </p>
        </div>
      </div>

      <div class="info-row">
        <div class="status-icon-box ok">
          <MdIcon name="settings_backup_restore" :size="20" filled />
        </div>
        <div class="info-row-copy">
          <strong>无损原版还原</strong>
          <p>随时从备份还原至未经修改的官方英文程序，不保留额外缓存或配置变更。</p>
        </div>
      </div>
    </div>

    <div class="about-project">
      <div class="about-project-copy">
        <span class="about-repo">haoze-evolluling / AntigravityCN</span>
        <p>基于 Material Design 3 构建的 Antigravity 简体中文汉化工具。</p>
        <span class="about-url selectable">{{ GITHUB_REPO_URL }}</span>
      </div>

      <MdButton
        variant="tonal"
        class="about-button"
        title="在默认浏览器中打开 GitHub 仓库"
        @click="openExternalUrl()"
      >
        <template #icon>
          <MdIcon name="arrow_outward" :size="17" />
        </template>
        打开仓库
      </MdButton>
    </div>
  </MdCard>
</template>
