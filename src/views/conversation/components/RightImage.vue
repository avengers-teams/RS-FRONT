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
import { useStorage } from '@vueuse/core/index';
import { computed, ref, watch } from 'vue';

import { getAskWebsocketApiUrl } from '@/api/chat';
import { generateConversationTitleApi, setConversationTitleApi } from '@/api/conv';
import LkIcon from '@/components/LKIcon.vue';
import { useConversationStore, useFileStore, useUserStore } from '@/store';
import {
  AskRequest,
  AskResponse,
  BaseChatMessage,
  BaseConversationHistory,
  BaseConversationSchema,
  OpenaiWebChatMessageMultimodalTextContentImagePart,
} from '@/types/schema';
import { taskTypeMap } from '@/utils/chat';
import { Dialog, LoadingBar, Message } from '@/utils/tips';
import HistoryContent from '@/views/conversation/components/HistoryContent.vue';
import InputRegion from '@/views/conversation/components/InputRegion.vue';
import { buildTemporaryMessage, modifiyTemporaryMessageContent } from '@/views/conversation/utils/message';
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
const inputValue = ref('');
const autoScrolling = useStorage('autoScrolling', true);
const canAbort = ref<boolean>(false);
const sendDisabled = computed(() => {
  return (
    loadingAsk.value ||
    currentConversationId.value == null ||
    inputValue.value === null ||
    inputValue.value.trim() == ''
  );
});
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
const currentConvHistory = computed<BaseConversationHistory | null>(() => {
  if (!currentConversationId.value) return null;
  return conversationStore.conversationHistoryMap[currentConversationId.value] || null;
});
const isAborted = ref<boolean>(false);
const fileStore = useFileStore();
const isCurrentNewConversation = computed<boolean>(() => {
  // return currentConversationId.value === conversationStore.newConversation?.conversation_id;
  return currentConversationId.value?.startsWith('new_conversation') || false;
});
const currentConversation = computed<BaseConversationSchema | null>(() => {
  if (isCurrentNewConversation.value) return conversationStore.newConversation;
  const conv = conversationStore.conversations?.find((conversation: BaseConversationSchema) => {
    return conversation.conversation_id == currentConversationId.value;
  });
  return conv || null;
});
const scrollToBottom = () => {
  historyRef.value.scrollTo({ left: 0, top: historyRef.value.$refs.scrollbarInstRef.contentRef.scrollHeight });
};
const hasNewConversation = ref<boolean>(false);
const userStore = useUserStore();
const sendMsg = async () => {
  if (sendDisabled.value || loadingAsk.value || currentConvHistory.value == null) {
    Message.error('请选择一个对话');
    return;
  }

  LoadingBar.start();
  loadingAsk.value = true;
  canContinue.value = false;
  const text = inputValue.value;
  inputValue.value = '';

  canAbort.value = false;
  isAborted.value = false;
  let hasGotReply = false;

  // 处理 gpt-4 图片
  let multimodalImages = null;

  multimodalImages = fileStore.uploadedFileInfos
    .filter((info) => info.openai_web_info && info.openai_web_info.file_id && info.content_type?.startsWith('image/'))
    .map((info) => {
      const fileId = info.openai_web_info!.file_id!;
      const { width, height } = info.extra_info || {};
      return {
        asset_pointer: `file-service://${fileId}`,
        width,
        height,
        size_bytes: info.size,
      } as OpenaiWebChatMessageMultimodalTextContentImagePart;
    });

  // 使用临时的随机 id 保持当前更新的两个消息
  if (text == ':continue') {
    currentSendMessage.value = null;
    currentRecvMessages.value = [];
  } else {
    currentSendMessage.value = buildTemporaryMessage(
      currentConversation.value!.task_type,
      'user',
      text,
      currentConvHistory.value?.current_node,
      multimodalImages
    );
    currentRecvMessages.value = [
      buildTemporaryMessage(currentConversation.value!.task_type, 'assistant', '...', currentSendMessage.value.id),
    ];
  }

  const askRequest: AskRequest = {
    new_conversation: isCurrentNewConversation.value,
    task_type: currentConversation.value!.task_type,
    text_content: text,
  };
  if (conversationStore.newConversation) {
    askRequest.new_title = conversationStore.newConversation.title || ''; // 这里可能为空串，表示需要生成标题
  } else {
    askRequest.conversation_id = currentConversationId.value!;
    askRequest.parent = currentConvHistory.value.current_node;
  }

  const wsUrl = getAskWebsocketApiUrl();
  let hasError = false;
  let wsErrorMessage: AskResponse | null = null;
  console.log('Connecting to', wsUrl, askRequest);
  const webSocket = new WebSocket(wsUrl);

  let respConversationId = null as string | null;

  webSocket.onopen = (_event: Event) => {
    webSocket.send(JSON.stringify(askRequest));
  };

  webSocket.onmessage = (event: MessageEvent) => {
    const response = JSON.parse(event.data) as AskResponse;
    // console.log('Received message from server:', reply);
    if (response.type === 'waiting') {
      // 等待回复
      canAbort.value = false;
      currentRecvMessages.value![0].content = modifiyTemporaryMessageContent(
        currentRecvMessages.value![0],
        '正在思考中'
      );
    } else if (response.type === 'queueing') {
      // 正在排队
      canAbort.value = true;
      currentRecvMessages.value![0].content = modifiyTemporaryMessageContent(
        currentRecvMessages.value![0],
        '正在回复其他用户,排队中'
      );
    } else if (response.type === 'message') {
      if (!hasGotReply) {
        currentRecvMessages.value = [];
        hasGotReply = true;
      }
      const message = response.message as BaseChatMessage;
      if (message.role == 'user') {
        console.log('got message', message);
        currentSendMessage.value = message;
      } else {
        if (message.title != null) {
          currentConvHistory.value!.title = message.title;
          return;
        }
        const index = currentRecvMessages.value.findIndex((msg) => msg.id === message.id);
        if (index === -1) {
          currentRecvMessages.value.push(message);
        } else {
          currentRecvMessages.value[index] = message;
        }
      }
      respConversationId = response.conversation_id || null;
      canAbort.value = true;
    } else if (response.type === 'error') {
      hasError = true;
      console.error('websocket received error message', response);
      wsErrorMessage = response;
      // TODO Message error
    }
    if (autoScrolling.value) scrollToBottom();
  };

  webSocket.onclose = async (event: CloseEvent) => {
    canAbort.value = false;
    console.log('WebSocket connection is closed', event, isAborted.value);
    if (!hasError && (event.code == 1000 || isAborted.value)) {
      // 正常关闭
      if (hasGotReply) {
        let allNewMessages = [] as BaseChatMessage[];
        if (currentSendMessage.value) {
          allNewMessages = [currentSendMessage.value] as BaseChatMessage[];
        }
        for (const msg of currentRecvMessages.value) {
          allNewMessages.push(msg);
        }

        // 更新对话信息，恢复正常状态
        if (isCurrentNewConversation.value) {
          // 尝试生成标题或保存标题
          if (
            askRequest.source == 'openai_web' &&
            (askRequest.new_title == undefined || askRequest.new_title.length == 0)
          ) {
            if (currentConvHistory.value!.title == undefined || currentConvHistory.value!.title.length == 0) {
              const lastRecvMessageId = allNewMessages[allNewMessages.length - 1].id;
              console.log('try to generate conversation title', respConversationId, lastRecvMessageId);
              try {
                const response = await generateConversationTitleApi(respConversationId!, lastRecvMessageId);
                currentConvHistory.value!.title = response.data;
              } catch (err) {
                console.error('Failed to generate conversation title', err);
              }
            } else {
              // 自动生成了标题，更新到数据库
              const title = currentConvHistory.value!.title;
              try {
                console.log('update title', respConversationId, title);
                await setConversationTitleApi(respConversationId!, title);
              } catch (err) {
                console.error('Failed to set conversation title', err);
              }
            }
          }

          const newConvHistory = {
            _id: respConversationId!,
            task_type: askRequest.task_type,
            title: currentConvHistory.value!.title,
            create_time: currentConvHistory.value!.create_time,
            update_time: currentConvHistory.value!.update_time,
            mapping: {},
            current_node: '',
          } as BaseConversationHistory;
          // conversationStore.$patch({
          //   conversationHistoryMap: {
          //     [respConversationId!]: newConvHistory,
          //   },
          // });
          conversationStore.conversationHistoryMap[respConversationId!] = newConvHistory;
        }
        conversationStore.addMessagesToConversation(respConversationId!, allNewMessages);
        currentSendMessage.value = null;
        currentRecvMessages.value = [];
        currentConversationId.value = respConversationId!; // 这里将会导致 currentConversation 切换

        // 清除附件
        fileStore.clear();

        await conversationStore.fetchAllConversations();
        conversationStore.removeNewConversation();
        hasNewConversation.value = false;
        console.log('done', allNewMessages, currentConversationId.value);
      }
    } else {
      let content = '';
      if (wsErrorMessage != null) {
        if (wsErrorMessage.tip) {
          content = wsErrorMessage.tip + ' ';
        }
        content += wsErrorMessage.error_detail || '未知错误';
      } else {
        content = `WebSocket ${event.code}: ${event.reason || '未知错误'}`;
      }
      Dialog.error({
        title: '获取回复失败',
        content,
        positiveText: '撤回消息',
        negativeText: '取消',
        onPositiveClick: () => {
          currentSendMessage.value = null;
          currentRecvMessages.value = [];
        },
      });
    }
    await userStore.fetchUserInfo();
    LoadingBar.finish();
    loadingAsk.value = false;
    isAborted.value = false;
  };

  webSocket.onerror = (event: Event) => {
    console.error('WebSocket error:', event);
  };

  // aborter = () => {
  //   isAborted.value = true;
  //   webSocket.close();
  // };
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
