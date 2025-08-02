<template>
  <!-- 右栏 -->
  <n-layout-content embeded :class="['flex flex-col overflow-hidden', gtmd() ? '' : 'min-w-100vw']">
    <div class="flex justify-center py-4 relative" :style="{ backgroundColor: themeVars.baseColor }">
      <n-text class="flex h-full items-center gap-1">
        {{ $t('commons.currentConversationModel') }}:
        <LkIcon style="height: 25px; width: 25px" />
        {{ taskTypeMap[convHistory?.task_type || ''] || null }}
      </n-text>
    </div>
    <n-split direction="horizontal" style="height: 90%" :max="0.75" :min="0.25" class="split">
      <template #1>
        <n-card class="left-card" style="text-align: center; cursor: pointer" @click="triggerFileInput">
          <div style="position: relative; justify-content: center; align-items: center">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              alt="Uploaded Image"
              style="max-width: 85%; max-height: 80%; object-fit: contain"
            />
            <img
              v-else
              src="/public/图片上传.png"
              alt="Click to upload"
              style="max-width: 100%; max-height: 200px; object-fit: contain"
            />
          </div>
          <!-- 隐藏的文件输入框 -->
          <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileChange" />
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
        <n-layout-content embeded :class="['flex flex-col overflow-hidden', gtmd() ? '' : 'min-w-20vw']">
          <div class="">
            <!-- 消息记录内容（用于全屏展示） -->
            <n-scrollbar
              v-if="currentConversationId"
              ref="historyRef"
              class="relative"
              :content-style="loadingHistory ? { height: '100%' } : {}"
            >
              <!-- 回到底部按钮 -->
              <div class="">
                <n-button secondary circle size="small" @click="scrollToBottomSmooth">
                  <template #icon>
                    <n-icon :component="ArrowDown" />
                  </template>
                </n-button>
              </div>
              <HistoryContent
                ref="historyContentRef"
                v-model:can-continue="canContinue"
                :conversation-id="currentConversationId"
                :extra-messages="currentActiveMessages"
                :fullscreen="false"
                :show-tips="showFullscreenTips"
                :loading="loadingHistory"
              />
            </n-scrollbar>
          </div>
          <InputRegion
            v-model:input-value="inputValue"
            v-model:auto-scrolling="autoScrolling"
            class="absolute bottom-5 left-0 right-0 mx-auto max-w-[767px] w-[95%] rounded-lg bg-transparent border-transparent"
            :can-abort="canAbort"
            :can-continue="!loadingAsk && canContinue"
            :send-disabled="sendDisabled"
            :upload-disabled="loadingAsk"
            @send-msg="sendMsg"
          />
        </n-layout-content>
      </template>
    </n-split>
  </n-layout-content>
</template>
<script setup lang="ts">
import { NButton, NCard, NIcon, NLayoutContent, NSelect, NSpace, NSplit, useThemeVars } from 'naive-ui';

import { screenWidthGreaterThan } from '@/utils/media';
const gtmd = screenWidthGreaterThan('md');
import { ArrowDown } from '@vicons/ionicons5';
import { computed, ref, watch } from 'vue';

import LkIcon from '@/components/LKIcon.vue';
import { useConversationStore } from '@/store';
import { BaseChatMessage, BaseConversationHistory } from '@/types/schema';
import { taskTypeMap } from '@/utils/chat';
import { LoadingBar } from '@/utils/tips';
import HistoryContent from '@/views/conversation/components/HistoryContent.vue';
import InputRegion from '@/views/conversation/components/InputRegion.vue';
const props = defineProps<{
  _currentConversationId: string | null;
}>();
const loadingAsk = ref(false);
const loadingHistory = ref<boolean>(false);
const conversationStore = useConversationStore();
const convHistory = computed<BaseConversationHistory | null>(() => {
  const conversationId = props._currentConversationId;
  if (!conversationId) return null;
  return conversationStore.conversationHistoryMap[conversationId];
});

const themeVars = useThemeVars();
const showFullscreenTips = ref(false);
const canContinue = ref<boolean>(false);
const historyRef = ref();
const scrollToBottomSmooth = () => {
  historyRef.value.scrollTo({
    left: 0,
    top: historyRef.value.$refs.scrollbarInstRef.contentRef.scrollHeight,
    behavior: 'smooth',
  });
};
const currentSendMessage = ref<BaseChatMessage | null>(null);
const currentRecvMessages = ref<BaseChatMessage[]>([]);
const currentActiveMessages = computed<Array<BaseChatMessage>>(() => {
  const result: BaseChatMessage[] = [];
  if (currentSendMessage.value) result.push(currentSendMessage.value);
  for (const msg of currentRecvMessages.value) {
    result.push(msg);
  }
  return result;
});
const imageUrl = ref<string | null>(null);
const triggerFileInput = () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  fileInput?.click();
};
const handleFileChange = (event: Event) => {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput?.files?.[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      imageUrl.value = reader.result as string;
    };
    reader.readAsDataURL(file); // 读取文件并转换为 Data URL 以便显示图片
  }
};

const multipleSelectValue = ref<string[]>([]);
const currentConversationId = ref<string | null>(props._currentConversationId || null);

const emit = defineEmits(['update']);

const options = ref([
  { label: '车辆', value: '车辆' },
  { label: '建筑物', value: '建筑物' },
  { label: '农田', value: '农田' },
  { label: '足球场', value: '足球场' },
  { label: '荒田', value: '荒田' },
  { label: '飞机', value: '飞机' },
]);
watch(props, () => {
  currentConversationId.value = props._currentConversationId;
});
watch(currentConversationId, (newVal, _oldVal) => {
  emit('update', currentConversationId.value);
  if (newVal != 'new_conversation') {
    handleChangeConversation(newVal);
  }
});
const handleChangeConversation = (key: string | null) => {
  // TODO: 清除当前已询问、得到回复，但是发生错误的两条消息
  if (loadingAsk.value || !key) return;
  loadingAsk.value = true;
  loadingHistory.value = true;
  LoadingBar.start();
  conversationStore
    .fetchConversationHistory(key)
    .then(() => {
      // console.log(conversationStore.conversationDetailMap);
    })
    .catch((err: any) => {
      console.log(err);
    })
    .finally(() => {
      loadingAsk.value = false;
      loadingHistory.value = false;
      LoadingBar.finish();
    });
};
</script>
<style scoped>
.split {
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
