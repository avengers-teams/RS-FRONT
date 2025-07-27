<template>
  <n-avatar color="#" :size="size" :class="props.alpha ? [`opacity-${props.alpha}`] : []">
    <LkIcon :size="48" />
  </n-avatar>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import LkIcon from './LKIcon.vue';

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
</script>
