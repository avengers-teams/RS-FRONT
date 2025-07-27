<template>
  <div class="mt-6">
    <n-form :label-placement="'left'" :label-align="'left'" label-width="100px">
      <n-form-item :label="t('labels.title')">
        <n-input
          v-model:value="newConversationInfo.title"
          :placeholder="
            newConversationInfo.source == 'openai_web' ? t('tips.NewConversationForm.leaveBlankToGenerateTitle') : null
          "
        />
      </n-form-item>

      <n-form-item label="任务类型">
        <n-select
          v-model:value="newConversationInfo.openaiWebPlugins"
          :options="typeOptions"
          :default-value="1"
          placeholder="请选择任务类型"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { SelectOption } from 'naive-ui';
import { computed, ref, watch } from 'vue';

import { i18n } from '@/i18n';
import { useAppStore, useUserStore } from '@/store';
import { NewConversationInfo } from '@/types/custom';
import { ChatSourceTypes } from '@/types/schema';

const t = i18n.global.t as any;

const userStore = useUserStore();
const appStore = useAppStore();

const emits = defineEmits<{
  (e: 'input', newConversationInfo: NewConversationInfo): void;
}>();

const availableChatSourceTypes = computed<SelectOption[]>(() => {
  if (!userStore.user) {
    return [];
  }
  return [
    {
      label: t('sources_short.openai_api'),
      value: 'openai_api',
    },
  ];
});

const availableModels = ref([
  {
    label: '九格',
    value: 'fm9g4bv',
  },
  {
    label: 'DeepSeek',
    value: 'deepseek-chat',
  },
]);

const newConversationInfo = ref<NewConversationInfo>({
  title: null,
  source: null,
  model: null,
  openaiWebPlugins: null,
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

function setDefaultValues() {
  //   const defaultSource = computed(() => {
  if (appStore.lastSelectedSource) {
    if (availableChatSourceTypes.value.find((source) => source.value === appStore.lastSelectedSource)) {
      newConversationInfo.value.source = appStore.lastSelectedSource;
    }
  } else {
    newConversationInfo.value.source =
      availableChatSourceTypes.value.length > 0 ? (availableChatSourceTypes.value[0].value as ChatSourceTypes) : null;
  }

  if (appStore.lastSelectedModel) {
    if (
      newConversationInfo.value.source === 'openai_web' &&
      availableModels.value.find((model) => model.value === appStore.lastSelectedModel)
    ) {
      newConversationInfo.value.model = appStore.lastSelectedModel;
    } else if (
      newConversationInfo.value.source === 'openai_api' &&
      availableModels.value.find((model) => model.value === appStore.lastSelectedModel)
    ) {
      newConversationInfo.value.model = appStore.lastSelectedModel;
    }
  }
}

setDefaultValues();

watch(
  () => {
    return {
      title: newConversationInfo.value.title,
      source: newConversationInfo.value.source,
      model: newConversationInfo.value.model,
      openaiWebPlugins: newConversationInfo.value.openaiWebPlugins,
    } as NewConversationInfo;
  },
  (newVal, _prev) => {
    // console.log('newConversationInfo', newVal);
    emits('input', newVal);
  },
  { immediate: true }
);

watch(
  () => newConversationInfo.value.source,
  () => {
    newConversationInfo.value.model = null;
  }
);
</script>
