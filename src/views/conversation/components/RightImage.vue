<script setup lang="ts"></script>

<template>
  <!-- 右栏 -->
  <n-layout-content embeded :class="['flex flex-col overflow-hidden', gtmd() ? '' : 'min-w-100vw']">
    <n-split direction="horizontal" style="height: 90%" :max="0.75" :min="0.25" class="split">
      <template #1>
        <n-card class="left-card">
          <img src="/public/图片上传.png" />
          <div class="text-center">点击上传图片</div>
        </n-card>
      </template>
      <template #2>
        <!-- 右侧面板的对话内容 -->
        <div class="flex-col" style="height: 100%; overflow-y: auto; padding: 10px">
          <div class="text-center text-gray-500" style="margin-top: 20px; font-size: 20px">
            请点击左侧面板的按钮上传图片并显示图片内容,根据需求选择或输入您需要的图像识别任务
          </div>
          <n-space vertical style="margin-top: 20px">
            <n-select v-model:value="multipleSelectValue" filterable multiple tag :options="options" />
          </n-space>
        </div>
      </template>
    </n-split>
  </n-layout-content>
</template>
<script setup lang="ts">
import { screenWidthGreaterThan } from '@/utils/media';
import { NCard, NLayoutContent, NSplit, NSelect, NSpace } from 'naive-ui';
const gtmd = screenWidthGreaterThan('md');
import { ref, multipleSelectValue } from 'vue';
const multipleSelectValue = ref<string[]>([]);
const options = ref([
  { label: '车辆', value: '车辆' },
  { label: '建筑物', value: '建筑物' },
  { label: '农田', value: '农田' },
  { label: '足球场', value: '地物分类与状态评估' },
  { label: '荒田', value: '场景推理与决策' },
]);
</script>
<style scoped>
.split {
  margin-top: 3%;
}
.left-card {
  height: 90%;
  width: 90%;
  border: 2px solid #e1e1e1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 5% 5%;
}
</style>
