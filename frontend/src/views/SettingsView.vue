<script setup lang="ts">
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import ProjectInfo from '@/components/settings/ProjectInfo.vue'
import EditorialNotes from '@/components/settings/EditorialNotes.vue'
</script>

<template>
  <div class="page-view" style="gap: 14px;">
    <ThemeSettings />
    <EditorialNotes />
    <ProjectInfo />
  </div>
</template>
