<template>
  <div>
    <div class="h-full flex flex-col flex-grow">
      <n-button
        v-if="!hasNewConversation"
        class="mb-2"
        secondary
        strong
        type="primary"
        :disabled="props.loading"
        @click="emits('new-conversation')"
      >
        <template #icon>
          <n-icon class="">
            <Add />
          </n-icon>
        </template>
        新任务
      </n-button>
      <div class="h-full">
        <n-menu
          ref="menuRef"
          v-model:value="convId"
          class="-mx-2 h-[61.5vh] overflow-y-auto"
          :content-style="{ backgroundColor: 'red' }"
          :disabled="props.loading"
          :options="menuOptions"
          :root-indent="18"
        />
        <div class="h-[24.5vh] overflow-y-auto">
          <!-- 左侧功能按钮 -->
          <n-list class="text-center">
            <hr class="bg-[#9A9A9A5F] border-none h-[0.5px]" />
            <n-list-item class="pb-3 pt-0 cursor-pointer" @click="emits('addEvent', 1)"> 图像语义生成 </n-list-item>
            <n-list-item class="py-5 cursor-pointer" @click="emits('addEvent', 2)"> 目标识别与计数 </n-list-item>
            <n-list-item class="py-5 cursor-pointer" @click="emits('addEvent', 3)"> 空间感知与定位 </n-list-item>
            <n-list-item class="py-5 cursor-pointer" @click="emits('addEvent', 4)"> 地物分类与状态评估 </n-list-item>
            <n-list-item class="py-3 cursor-pointer" @click="emits('addEvent', 5)"> 场景推理与决策 </n-list-item>
          </n-list>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Add } from '@vicons/ionicons5';
import { MenuOption, NEllipsis } from 'naive-ui';
import { computed, defineEmits, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import LkAvatar from '@/components/LKAvatar.vue';
import { useAppStore, useConversationStore } from '@/store';
import { BaseConversationSchema } from '@/types/schema';
import { dropdownRenderer, popupChangeConversationTitleDialog } from '@/utils/renders';
import { Dialog, Message } from '@/utils/tips';

const { t } = useI18n();

const conversationStore = useConversationStore();
const appStore = useAppStore();
const props = defineProps<{
  loading: boolean;
  value: string | null;
}>();

const emits = defineEmits<{
  (e: 'update:value', value: string | null): void;
  (e: 'new-conversation'): void;
  (e: 'addEvent', value: any): void;
}>();

// get and set to bind convId and value
const convId = computed<string | null>({
  get() {
    return props.value;
  },
  set(value: string | null) {
    emits('update:value', value);
  },
});

const hasNewConversation = computed<boolean>(() => {
  return !!conversationStore.newConversation;
});

const menuOptions = computed<MenuOption[]>(() => {
  // 根据 create_time 降序排序
  const sorted_conversations = conversationStore.conversations
    ?.slice() // 创建一个新的数组副本
    .sort((a: BaseConversationSchema, b: BaseConversationSchema) => {
      // return a.create_time - b.create_time;
      if (!a.create_time) return -1;
      if (!b.create_time) return 1;
      const date_a = new Date(a.create_time),
        date_b = new Date(b.create_time);
      return date_b.getTime() - date_a.getTime();
    });
  const results = sorted_conversations?.map((conversation: BaseConversationSchema) => {
    return {
      label: () => h(NEllipsis, null, { default: () => conversation.title || '新任务' }),
      key: conversation.conversation_id,
      disabled: props.loading == true,
      icon: () => h(LkAvatar, { size: 20, class: 'opacity-80' }, { default: () => null }),
      extra: () => dropdownRenderer(conversation, handleDeleteConversation, handleChangeConversationTitle),
    } as MenuOption;
  });
  if (results && conversationStore.newConversation) {
    const displayTitle = conversationStore.newConversation.title?.length
      ? conversationStore.newConversation.title
      : t('commons.newConversation');
    results.unshift({
      label: () => displayTitle,
      key: conversationStore.newConversation.conversation_id || undefined,
      disabled: props.loading == true,
    });
  }
  return results;
});

const handleDeleteConversation = (conversation_id: string | undefined) => {
  if (!conversation_id) return;
  const d = Dialog.info({
    title: t('commons.confirmDialogTitle'),
    content: t('tips.deleteConversation'),
    positiveText: t('commons.confirm'),
    negativeText: t('commons.cancel'),
    onPositiveClick: () => {
      d.loading = true;
      return new Promise((resolve) => {
        conversationStore
          .deleteConversation(conversation_id)
          .then(() => {
            Message.success(t('tips.deleteConversationSuccess'));
            if (convId.value == conversation_id) convId.value = null;
          })
          .catch(() => {
            Message.error(t('tips.deleteConversationFailed'));
          })
          .finally(() => {
            d.loading = false;
            resolve(true);
          });
      });
    },
  });
};

const handleChangeConversationTitle = (conversation_id: string | undefined) => {
  if (!conversation_id) return;
  popupChangeConversationTitleDialog(
    conversation_id,
    async (title: string) => {
      await conversationStore.changeConversationTitle(conversation_id, title);
    },
    () => {
      Message.success(t('tips.changeConversationTitleSuccess'));
    },
    () => {
      Message.error(t('tips.changeConversationTitleFailed'));
    }
  );
};
</script>

<style>
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
