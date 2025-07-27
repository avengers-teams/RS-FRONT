<template>
  <n-avatar color="#2F94FF" :size="size" :class="props.alpha ? [`opacity-${props.alpha}`] : []">
    <ChatGPTIcon v-if="iconStyle == 'default'" :size="48" />
  </n-avatar>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { getChatModelIconStyle } from '@/utils/chat';

import ChatGPTIcon from './ChatGPTIcon.vue';

const props = defineProps<{
  model?: string | null;
  iconStyle?: 'default' | 'plugins' | 'browsing' | 'code-interpreter' | 'dalle';
  color?: string;
  alpha?: number;
  size?: any;
}>();

const size = computed(() => {
  if (props.size) {
    return props.size;
  }
  return 'large';
});

const iconStyle = computed(() => {
  if (props.model) {
    return getChatModelIconStyle(props.model);
  }
  return props.iconStyle || 'default';
});
</script>
