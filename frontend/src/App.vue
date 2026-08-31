<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { NavTab } from '@/types'
import { useTheme } from '@/composables/useTheme'
import { useTerminalLog } from '@/composables/useTerminalLog'
import { useAntigravity } from '@/composables/useAntigravity'

import AppTitlebar from '@/components/common/AppTitlebar.vue'
import ToastNotification from '@/components/common/ToastNotification.vue'
import ProcessConflictModal from '@/components/common/ProcessConflictModal.vue'
import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'

const activeTab = ref<NavTab>('dashboard')

const { initTheme } = useTheme()
const { initLogListener } = useTerminalLog()
const {
  showConflictModal,
  loadInitialState,
  handleCancelConflict,
  handleConfirmConflictAutoClose
} = useAntigravity()

onMounted(async () => {
  initTheme()
  initLogListener()
  await loadInitialState()
})
</script>

<template>
  <!-- Subtle Xuan Paper Grain & Ink Aura Background -->
  <div class="ink-ambient-layer">
    <div class="ink-blob blob-top"></div>
    <div class="ink-blob blob-bottom"></div>
    <div class="paper-grain-overlay"></div>
  </div>

  <div class="app-container">
    <AppTitlebar v-model:active-tab="activeTab" />

    <!-- Main Content Area -->
    <main class="main-content">
      <Transition name="page-fade" mode="out-in">
        <DashboardView v-if="activeTab === 'dashboard'" />
        <SettingsView v-else @back="activeTab = 'dashboard'" />
      </Transition>
    </main>
  </div>

  <!-- Process Conflict Modal -->
  <ProcessConflictModal
    :visible="showConflictModal"
    @cancel="handleCancelConflict"
    @confirm-auto-close="handleConfirmConflictAutoClose"
  />

  <!-- Toast Notification -->
  <ToastNotification />
</template>
