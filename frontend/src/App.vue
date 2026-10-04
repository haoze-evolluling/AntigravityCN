<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { NavTab } from '@/types'
import { useTheme } from '@/composables/useTheme'
import { useTerminalLog } from '@/composables/useTerminalLog'
import { useAntigravity } from '@/composables/useAntigravity'

import AppSidebar from '@/components/common/AppSidebar.vue'
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
  <div class="app-shell">
    <!-- Left Navigation Sidebar -->
    <AppSidebar v-model:active-tab="activeTab" />

    <!-- Right Workspace Area -->
    <div class="main-wrapper">
      <AppTitlebar :active-tab="activeTab" />

      <main class="main-content">
        <Transition name="page-fade" mode="out-in">
          <DashboardView v-if="activeTab === 'dashboard'" />
          <SettingsView v-else />
        </Transition>
      </main>
    </div>
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
