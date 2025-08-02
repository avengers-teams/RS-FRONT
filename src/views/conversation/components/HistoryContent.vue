<template>
  <div id="print-content" ref="contentRef" class="flex flex-col h-full p-0" tabindex="0" style="outline: none">
    <div v-if="!props.loading" class="relative">
      <div class="flex justify-center py-4 relative" :style="{ backgroundColor: themeVars.baseColor }">
        <n-text class="flex h-full items-center gap-1">
          {{ $t('commons.currentConversationModel') }}:
          <LkIcon style="height: 25px; width: 25px" />
          {{ taskTypeMap[convHistory?.task_type || ''] || null }}
        </n-text>
      </div>
      <!-- 消息记录 -->
      <MessageRow
        v-for="messages in filteredMessagesList"
        :key="messages[0].id"
        :messages="messages"
        :conversation-id="conversationId"
      />
    </div>
    <n-empty
      v-else
      class="h-full flex justify-center"
      :style="{ backgroundColor: themeVars.cardColor }"
      :description="$t('tips.loading')"
    >
      <template #icon>
        <n-spin size="medium" />
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@vicons/ionicons5';
import { useThemeVars } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import LkIcon from '@/components/LKIcon.vue';
import { useConversationStore } from '@/store';
import { BaseChatMessage, BaseConversationHistory } from '@/types/schema';
import { getMessageListFromHistory, mergeContinuousMessages, taskTypeMap } from '@/utils/chat';
import { Message } from '@/utils/tips';

import MessageRow from './MessageRow.vue';

const { t } = useI18n();

const themeVars = useThemeVars();
const conversationStore = useConversationStore();

const props = defineProps<{
  conversationId: string;
  extraMessages: BaseChatMessage[];
  fullscreen: boolean; // 初始状态下是否全屏
  showTips: boolean;
  loading: boolean;
}>();

const emits = defineEmits<{
  (e: 'update:can-continue', value: boolean): void;
}>();

const contentRef = ref();
const historyContentParent = ref<HTMLElement>();
const _fullscreen = ref(false);

const convHistory = computed<BaseConversationHistory | null>(() => {
  const conversationId = props.conversationId;
  if (!conversationId) return null;
  return conversationStore.conversationHistoryMap[conversationId];
});

const rawMessages = computed<BaseChatMessage[]>(() => {
  let result = convHistory.value ? getMessageListFromHistory(convHistory.value) : [];
  result = result.concat(props.extraMessages || []);
  let canContinue = false;
  if (result.length > 0) {
    const lastMessage = result[result.length - 1];
    if (lastMessage.role == 'assistant') {
      canContinue = true;
    }
  }
  emits('update:can-continue', canContinue);
  return result;
});

const filteredMessages = computed<BaseChatMessage[]>(() => {
  return rawMessages.value
    ? rawMessages.value.filter((message) => {
        if (message.role == 'system') return false;
        return true;
      })
    : [];
});

const filteredMessagesList = computed<BaseChatMessage[][]>(() => {
  return mergeContinuousMessages(filteredMessages.value);
});

const focus = () => {
  contentRef.value.focus();
};

defineExpose({
  focus,
});
</script>
