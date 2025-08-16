<template>
  <n-layout
    ref="rootRef"
    has-sider
    :class="['h-full', !appStore.preference.widerConversationPage ? 'lg:w-screen-lg lg:mx-auto' : '']"
  >
    <!-- 左栏 -->
    <n-layout-sider
      v-model:collapsed="foldLeftBar"
      :native-scrollbar="false"
      :collapsed-width="0"
      collapse-mode="transform"
      trigger-style="top: 27px; right: -26px;"
      collapsed-trigger-style="top: 27px; right: -26px;"
      bordered
      show-trigger="arrow-circle"
      :width="280"
      class="h-full"
    >
      <LeftBar
        v-model:value="currentConversationId"
        :class="['h-full pt-4 px-4 box-border mb-4 overflow-hidden flex flex-col space-y-4']"
        :loading="loadingAsk"
        @new-conversation="makeNewTask"
        @add-event="handleEvent"
      />
    </n-layout-sider>
    <!-- 右栏 -->
    <RightConversation
      v-if="appStore.currentTaskType !== 2"
      :_current-conversation-id="currentConversationId"
      @update="updateConvId"
    />
    <RightImage v-else :_current-conversation-id="currentConversationId" @update="updateConvId" />
  </n-layout>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { ref, watch } from 'vue';

import { useAppStore, useConversationStore, useFileStore } from '@/store';
import { NewConversationInfo } from '@/types/custom';
import { taskTypeMap } from '@/utils/chat';
import { popupNewConversationDialog } from '@/utils/renders';
import { LoadingBar } from '@/utils/tips';
import LeftBar from '@/views/conversation/components/LeftBar.vue';
import RightConversation from '@/views/conversation/components/RightConversation.vue';
import RightImage from '@/views/conversation/components/RightImage.vue';

const fileStore = useFileStore();

const handleEvent = (data: any) => {
  fileStore.clear();
  conversationStore.createNewConversation({
    title: `新任务(${taskTypeMap[data]})`,
    task_type: data,
  } as NewConversationInfo);
  currentConversationId.value = conversationStore.newConversation!.conversation_id!;
  hasNewConversation.value = true;
  appStore.currentTaskType = data;
};
const rootRef = ref();
const appStore = useAppStore();

const conversationStore = useConversationStore();

const loadingAsk = ref(false);
const loadingHistory = ref<boolean>(false);

const foldLeftBar = useStorage('foldLeftBar', false);

const hasNewConversation = ref<boolean>(false);
const currentConversationId = ref<string | null>(null);

watch(currentConversationId, (newVal, _oldVal) => {
  if (newVal != 'new_conversation') {
    handleChangeConversation(newVal);
  }
});

const updateConvId = (new_id: any) => {
  currentConversationId.value = new_id;
  hasNewConversation.value = false;
};

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
      appStore.currentTaskType = conversationStore.conversationHistoryMap[key]?.task_type;
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

const makeNewTask = () => {
  if (hasNewConversation.value) return;
  popupNewConversationDialog(async (newConversationInfo: NewConversationInfo) => {
    console.log('makeNewConversation', newConversationInfo);
    newConversationInfo.title = newConversationInfo.title || `新任务(${taskTypeMap[newConversationInfo.task_type]})`;
    conversationStore.createNewConversation(newConversationInfo);
    currentConversationId.value = conversationStore.newConversation!.conversation_id!;
    hasNewConversation.value = true;
    appStore.lastSelectedType = newConversationInfo.task_type;
    appStore.currentTaskType = newConversationInfo.task_type;
  });
};

// 加载对话列表
conversationStore.fetchAllConversations().then();
</script>

<style>
textarea.n-input__textarea-el {
  resize: none;
}

div.n-menu-item-content-header {
  display: flex;
  justify-content: space-between;
}

span.n-menu-item-content-header__extra {
  display: inline-block;
}

.left-col .n-card__content {
  @apply flex flex-col overflow-auto !important;
}

@media print {
  body * {
    visibility: hidden;
  }

  #print-content * {
    visibility: visible;
  }

  /* no margin in page */
  @page {
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
