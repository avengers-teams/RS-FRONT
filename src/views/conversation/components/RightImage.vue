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

    <n-split direction="horizontal" style="height: calc(100% - 60px)" :max="0.75" :min="0.25" class="content-split">
      <template #1>
        <div
          class="h-full w-full flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
        >
          <!-- Full-width image display area -->
          <n-upload
            v-model:file-list="fileStore.naiveUiUploadFileInfos"
            :custom-request="customRequest"
            :show-file-list="false"
            directory-dnd
            :on-before-upload="checkFileBeforeUpload"
            action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
            :theme-overrides="{
              itemDisabledOpacity: '1',
            }"
            :disabled="!isCurrentNewConversation && imageUrl"
            :max="1"
          >
            <n-upload-dragger v-if="!imageUrl" class="h-full" :disabled="!isCurrentNewConversation && imageUrl">
              <div class="w-full h-full flex justify-center items-center cursor-pointer">
                <div class="upload-placeholder text-center">
                  <n-icon size="60" class="upload-icon pulse-animation">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                      />
                    </svg>
                  </n-icon>
                  <p class="mt-4 text-lg font-medium upload-text">点击上传图片</p>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">支持 JPG, PNG,TIFF 等格式</p>
                </div>
              </div>
            </n-upload-dragger>
            <div v-else class="h-full w-full image-container relative">
              <img :src="imageUrl" alt="Uploaded Image" class="w-full h-full object-contain" />

              <!-- Overlay during upload -->
              <div
                v-if="isUploading"
                class="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center"
              >
                <p class="text-white text-lg mb-4">正在上传图片...</p>
                <n-progress
                  type="line"
                  :percentage="percentage"
                  :show-indicator="true"
                  status="success"
                  :processing="true"
                  class="w-3/4 max-w-md"
                />
              </div>

              <!-- Only show delete button for new conversations -->
              <n-button
                v-if="!isUploading && isCurrentNewConversation"
                type="error"
                size="small"
                circle
                class="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 transition-all"
                @click="imageUrl = null"
              >
                <template #icon>
                  <n-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </n-upload>
        </div>
      </template>

      <template #2>
        <div class="flex flex-col h-full conversation-container">
          <!-- Enhanced task selection area -->
          <div
            class="task-selection-container px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-4 mx-4 mt-4 shadow-sm"
          >
            <h3 class="text-center text-lg font-medium mb-3 task-title">
              <span class="task-icon mr-2">🔍</span>选择图像识别任务
            </h3>
            <n-select
              v-model:value="multipleSelectValue"
              filterable
              multiple
              tag
              :options="options"
              class="task-select"
              size="large"
              placeholder="请选择或输入识别任务类型"
              @update:value="selectUpdate"
            />
          </div>

          <!-- Enhanced conversation area -->
          <div class="flex-grow conversation-content px-4 pb-4">
            <n-scrollbar
              v-if="currentConversationId"
              ref="historyRef"
              class="relative h-full custom-scrollbar"
              :content-style="loadingHistory ? { height: '100%' } : {}"
            >
              <!-- Enhanced back to bottom button -->
              <div class="scroll-button">
                <n-button secondary circle size="medium" class="floating-button" @click="scrollToBottomSmooth">
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

            <!-- Enhanced empty state -->
            <div v-else class="flex-col flex items-center justify-center h-full text-center text-gray-500 empty-state">
              <n-icon size="64" class="mb-5 text-gray-400 empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </n-icon>
              <p style="font-size: 18px" class="font-medium mb-2">开始您的图像识别</p>
              <p style="font-size: 14px" class="max-w-md">请点击左侧面板上传图片，并选择您需要的图像识别任务</p>
            </div>
          </div>

          <!-- Enhanced input area -->
          <div class="mt-auto mb-4 flex justify-center px-4 w-full">
            <InputRegion
              v-model:input-value="inputValue"
              v-model:auto-scrolling="autoScrolling"
              class="w-full max-w-3xl rounded-lg"
              :can-abort="canAbort"
              :can-continue="!loadingAsk && canContinue"
              :send-disabled="sendDisabled"
              :upload-disabled="loadingAsk"
              @send-msg="sendMsg"
            />
          </div>
        </div>
      </template>
    </n-split>
  </n-layout-content>
</template>

<script setup lang="ts">
import {
  NButton,
  NCard,
  NIcon,
  NLayoutContent,
  NProgress,
  NSelect,
  NSpace,
  NSplit,
  NText,
  NUpload,
  NUploadDragger,
  UploadCustomRequestOptions,
  UploadFileInfo,
  useThemeVars,
} from 'naive-ui';

import { screenWidthGreaterThan } from '@/utils/media';
const gtmd = screenWidthGreaterThan('md');
import { ArrowDown } from '@vicons/ionicons5';
import { useStorage } from '@vueuse/core/index';
import axios from 'axios';
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

const percentage = ref(0);
const isUploading = ref(false);
const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
const isSupportedImage = (file: File) => {
  return acceptedMimeTypes.includes(file.type);
};
const checkFileBeforeUpload = (options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const rawFile = options.file.file as File;
  if (!isSupportedImage(rawFile)) {
    Message.warning('{[options.file.name]}tips.unsupportedImageFormat');
    return false;
  }
  // 可以根据需要调整文件大小限制
  if (rawFile.size > 1024 * 1024 * 1024) {
    Message.warning('{[options.file.name]}tips.fileSizeTooLarge');
    return false;
  }
  // 如果不是新对话且已有图片，不允许上传
  if (!isCurrentNewConversation.value && imageUrl.value) {
    Message.warning('已有图片的对话不能上传新图片');
    return false;
  }
  return true;
};

const customRequest = async ({ file, onFinish, onError, onProgress }: UploadCustomRequestOptions) => {
  console.log('customRequest', file);
  try {
    if (!file.file) {
      throw new Error('Failed to get the file.');
    }

    const rawFile = file.file as File;
    if (!isSupportedImage(rawFile)) {
      Message.warning('{[file.name]}unsupportedImageFormat');
      onError();
      return;
    }

    // 先显示预览图片
    const reader = new FileReader();
    reader.onload = () => {
      imageUrl.value = reader.result as string;
      isUploading.value = true; // 开始上传，显示蒙版
      percentage.value = 0; // 重置进度条
    };
    reader.readAsDataURL(rawFile);

    // 创建FormData对象
    const formData = new FormData();
    formData.append('images', rawFile);

    // 发送到新的上传接口
    const response = await axios.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ percent: percentCompleted });
          percentage.value = percentCompleted; // 更新进度条
        }
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to upload the file.');
    }

    // 假设后端返回的是一个文件信息数组，我们取第一个
    const uploadedFileInfo = response.data[0];

    // 存储上传的文件信息
    fileStore.uploadedFileInfos = [...fileStore.uploadedFileInfos, uploadedFileInfo];
    fileStore.naiveUiFileIdToServerFileIdMap[file.id] = uploadedFileInfo.hash_name;
    console.log(fileStore.uploadedFileInfos);

    // 文件上传成功完成
    Message.success(`文件 ${[file.name]} 上传成功`);
    isUploading.value = false; // 上传完成，隐藏蒙版
    onFinish();
  } catch (error) {
    isUploading.value = false; // 上传失败，隐藏蒙版
    Message.error(
      '文件 {[file.name]} 上传失败' + `: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      { duration: 5 * 1000 }
    );
    console.error(error);
    onError();
  }
};

const themeVars = useThemeVars();
const inputValue = ref('');
const autoScrolling = useStorage('autoScrolling', true);
const canAbort = ref<boolean>(false);
const sendDisabled = computed(() => {
  return (
    loadingAsk.value ||
    currentConversationId.value == null ||
    inputValue.value === null ||
    inputValue.value.trim() == '' ||
    multipleSelectValue.value == null
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

const multipleSelectValue = ref<string[]>([]);
const currentConversationId = ref<string | null>(props._currentConversationId || null);
const selectUpdate = () => {
  if (multipleSelectValue.value.length === 0) {
    inputValue.value = '';
    return;
  }
  inputValue.value = '请帮我统计' + multipleSelectValue.value.toString() + '的数量';
};
watch(inputValue, (newValue) => {
  if (newValue.trim() === '') {
    multipleSelectValue.value = [];
  } else {
    // 自动填充任务类型
    const matchedOptions = options.value.filter((option) => newValue.includes(option.label));
    multipleSelectValue.value = matchedOptions.map((option) => option.value);
  }
});
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

  // 处理图片
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
};
</script>
<style scoped>
.header-bar {
  background: linear-gradient(to right, #f3f4f6, #e5e7eb);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dark .header-bar {
  background: linear-gradient(to right, #1f2937, #111827);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.model-info {
  padding: 6px 12px;
  border-radius: 8px;
}

.model-name {
  font-weight: 600;
  color: #4f46e5;
}

.dark .model-name {
  color: #818cf8;
}

.image-upload-card {
  width: 90%;
  max-width: 500px;
  height: 400px;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.image-upload-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.image-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.uploaded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.upload-icon {
  color: #6366f1;
  opacity: 0.8;
}

.dark .upload-icon {
  color: #818cf8;
}

.upload-text {
  color: #4f46e5;
}

.dark .upload-text {
  color: #818cf8;
}

.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.task-selection-container {
  transition: all 0.3s ease;
}

.task-title {
  color: #4f46e5;
}

.dark .task-title {
  color: #818cf8;
}

.task-icon {
  display: inline-block;
}

.task-select {
  transition: all 0.2s ease;
}

.conversation-container {
  background: #f9fafb;
}

.dark .conversation-container {
  background: #1f2937;
}

.floating-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.empty-icon {
  opacity: 0.6;
}

.empty-state {
  padding: 2rem;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}

.input-region {
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.input-region:focus-within {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
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
