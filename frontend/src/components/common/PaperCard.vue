<script setup lang="ts">
defineProps<{
  sectionNum?: string
  heading?: string
  cardClass?: string
}>()
</script>

<template>
  <section class="paper-card" :class="cardClass">
    <div v-if="sectionNum || heading || $slots['header-action']" class="section-meta-header">
      <div class="section-title-wrap">
        <span v-if="sectionNum" class="section-num">{{ sectionNum }}</span>
        <h2 v-if="heading" class="section-heading">{{ heading }}</h2>
        <slot name="title-extra"></slot>
      </div>
      <slot name="header-action"></slot>
    </div>
    <slot></slot>
  </section>
</template>
