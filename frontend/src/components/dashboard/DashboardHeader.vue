<script setup lang="ts">
import { computed } from 'vue'
import { useAntigravity } from '@/composables/useAntigravity'
import MdBadge from '@/components/md3/MdBadge.vue'
import MdIcon from '@/components/md3/MdIcon.vue'

const { currentStatus } = useAntigravity()

const localizationState = computed<{
  label: string
  status: 'ok' | 'warn' | 'default'
  description: string
}>(() => {
  if (!currentStatus.value.asarExists) {
    return {
      label: '待检测',
      status: 'warn',
      description: '尚未检测到 app.asar，请先选择 Antigravity 安装目录中的核心文件。'
    }
  }

  if (currentStatus.value.isLocalized) {
    return {
      label: '已汉化',
      status: 'ok',
      description: '当前为简体中文界面，可更新补丁或随时还原官方英文原版。'
    }
  }

  return {
    label: '英文原版',
    status: 'default',
    description: '当前为官方英文界面，安装汉化后即可切换为简体中文。'
  }
})
</script>

<template>
  <section class="page-heading">
    <div class="page-heading-copy">
      <span class="page-eyebrow">本地汉化管理</span>
      <div class="page-title-row">
        <h1 class="page-title">汉化工作台</h1>
        <MdBadge :status="localizationState.status" :show-dot="true">
          {{ localizationState.label }}
        </MdBadge>
      </div>
      <p class="page-description">{{ localizationState.description }}</p>
    </div>

    <div v-if="currentStatus.isRunning" class="page-notice">
      <MdIcon name="warning" :size="18" filled />
      <span>Antigravity 正在运行，安装或还原前会请求关闭客户端。</span>
    </div>
  </section>
</template>
