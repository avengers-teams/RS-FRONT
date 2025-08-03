<template>
  <div class="mt-6">
    <n-form :label-placement="'left'" :label-align="'left'" label-width="100px">
      <n-form-item :label="t('labels.title')">
        <n-input v-model:value="newConversationInfo.title" placeholder="任务名称" />
      </n-form-item>

      <n-form-item label="任务类型">
        <n-select
          v-model:value="newConversationInfo.task_type"
          :options="typeOptions"
          :default-value="1"
          placeholder="请选择任务类型"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { i18n } from '@/i18n';
import { NewConversationInfo } from '@/types/custom';

const t = i18n.global.t as any;

const emits = defineEmits<{
  (e: 'input', newConversationInfo: NewConversationInfo): void;
}>();

const newConversationInfo = ref<NewConversationInfo>({
  title: null,
  task_type: null,
});

const typeOptions = ref([
  {
    label: '图像语义生成',
    value: 1,
  },
  {
    label: '目标识别与计数',
    value: 2,
  },
  {
    label: '空间感知与定位',
    value: 3,
  },
  {
    label: '地物分类与状态评估',
    value: 4,
  },
  {
    label: '场景推理与决策',
    value: 5,
  },
]);

watch(
  () => {
    return {
      title: newConversationInfo.value.title,
      task_type: newConversationInfo.value.task_type,
    } as NewConversationInfo;
  },
  (newVal, _prev) => {
    // console.log('newConversationInfo', newVal);
    emits('input', newVal);
  },
  { immediate: true }
);
</script>
