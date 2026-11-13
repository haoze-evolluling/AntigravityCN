<script setup lang="ts">
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PathSection from '@/components/dashboard/PathSection.vue'
import ActionBar from '@/components/dashboard/ActionBar.vue'
import ExecutionLog from '@/components/dashboard/ExecutionLog.vue'
</script>

<template>
  <div class="page-view">
    <DashboardHeader />
    <PathSection />
    <ActionBar />
    <ExecutionLog />
  </div>
</template>
