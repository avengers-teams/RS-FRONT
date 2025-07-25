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
      <n-form-item :label="t('labels.model')">
        <n-select
          v-model:value="newConversationInfo.model"
          :options="availableModels"
          :virtual-scroll="false"
          :consistent-menu-width="false"
          :render-label="renderModelSelectionLabel"
          :render-option="renderModelSelectionOption"
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
import { NTooltip, SelectOption } from 'naive-ui';
import { computed, h, ref, VNode, watch } from 'vue';

import { i18n } from '@/i18n';
import { useAppStore, useUserStore } from '@/store';
import { NewConversationInfo } from '@/types/custom';
import { ChatSourceTypes } from '@/types/schema';

import NewConversationFormModelSelectionLabel from './NewConversationFormModelSelectionLabel.vue';

const t = i18n.global.t as any;

const userStore = useUserStore();
const appStore = useAppStore();

const emits = defineEmits<{
  (e: 'input', newConversationInfo: NewConversationInfo): void;
}>();

const currentHoveringModel = ref<string | null>(null);

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

function renderModelSelectionLabel(option: SelectOption) {
  return h(NewConversationFormModelSelectionLabel, {
    source: newConversationInfo.value.source!,
    model: option.value as string,
  });
}

function renderModelSelectionOption({ node, option }: { node: VNode; option: SelectOption }) {
  return h(
    NTooltip,
    {
      class: 'hidden',
      onUpdateShow: (value: boolean) => {
        if (value) {
          currentHoveringModel.value = option.value as string;
        } else {
          currentHoveringModel.value = null;
        }
      },
    },
    {
      trigger: () => node,
      default: () => null,
    }
  );
}

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
