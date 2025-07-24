<template>
  <n-image width="45" src="/logo.png" />
</template>

<script setup lang="ts">
const props = defineProps({
  color: {
    type: String,
    default: 'black',
  },
});
</script>
