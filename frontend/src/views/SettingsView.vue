<script setup lang="ts">
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import HelpAbout from '@/components/settings/HelpAbout.vue'
</script>

<template>
  <div class="page-view settings-page">
    <section class="settings-section">
      <div class="settings-section-heading">
        <span class="page-eyebrow">外观</span>
        <p>选择适合当前环境与使用习惯的界面主题。</p>
      </div>
      <ThemeSettings />
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <span class="page-eyebrow">帮助与关于</span>
        <p>了解备份与还原机制，或访问项目开源仓库。</p>
      </div>
      <HelpAbout />
    </section>
  </div>
</template>
