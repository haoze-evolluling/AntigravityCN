<script setup lang="ts">
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import ProjectInfo from '@/components/settings/ProjectInfo.vue'
import EditorialNotes from '@/components/settings/EditorialNotes.vue'

const emit = defineEmits<{
  (e: 'back'): void
}>()
</script>

<template>
  <div class="page-view">
    <div class="settings-header">
      <button
        class="paper-action-btn back-nav-btn"
        title="返回主界面"
        @click="emit('back')"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
          <path
            fill-rule="evenodd"
            d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
            clip-rule="evenodd"
          />
        </svg>
        <span>返回主页</span>
      </button>
      <div class="settings-title-wrap">
        <span class="section-num">SECTION 02</span>
        <h2 class="settings-main-title">偏好设定与项目信息</h2>
      </div>
    </div>

    <div class="settings-scroll-container">
      <ThemeSettings />
      <ProjectInfo />
      <EditorialNotes />
    </div>
  </div>
</template>
