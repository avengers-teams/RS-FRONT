<template>
  <n-image width="45" src="/logo.png" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  size?: any;
  innerColor?: string;
}>();

const size = computed(() => props.size || 48);

const innerColor = computed(() => props.innerColor || '#fff');
</script>
