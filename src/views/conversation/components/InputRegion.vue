<template>
  <div class="flex flex-col align-middle" :style="{ background: themeVars.baseColor }">
    <n-divider />
    <!-- 暂停按钮 -->
    <div class="flex w-full justify-center absolute -top-10">
      <n-button v-show="canAbort" secondary strong type="error" size="small" @click="emits('abort-request')">
        <template #icon>
          <Stop />
        </template>
        {{ t('commons.abortRequest') }}
      </n-button>
    </div>

    <!-- 继续生成按钮 -->
    <div class="flex w-full justify-center absolute -top-10">
      <n-button v-show="canContinue" secondary strong type="success" size="small" @click="emits('continue-generating')">
        <template #icon>
          <DoubleArrowRound />
        </template>
        {{ t('commons.continueGenerating') }}
      </n-button>
    </div>
    <!-- 输入框 -->
    <div class="mx-80 mb-4 flex flex-row space-x-2 items-center">
      <!-- 文件上传按钮 -->
      <n-badge :value="fileStore.uploadedFileInfos.length" :offset="[-6, 3]">
        <n-button class="top-5" strong secondary circle @click="showFileUpload = !showFileUpload">
          <template #icon>
            <n-icon><AttachFileFilled /></n-icon>
          </template>
        </n-button>
      </n-badge>
      <n-input
        ref="inputRef"
        v-model:value="inputValue"
        class="rounded-lg top-5 flex-1"
        type="textarea"
        :bordered="true"
        :placeholder="$t('tips.sendMessage', [appStore.preference.sendKey])"
        :autosize="{ minRows: 5, maxRows: 5 }"
        :style="inputStyle"
        @keydown="shortcutSendMsg"
        @paste="onPaste"
      >
        <template #suffix>
          <n-button :disabled="sendDisabled" text class="" type="primary" size="small" @click="emits('send-msg')">
            <template #icon>
              <n-icon> <Send /> </n-icon>
            </template>
          </n-button>
        </template>
      </n-input>
    </div>
    <!--<div class="mb-1 mx-auto">
      <n-text depth="3" class="text-size-[0.6rem]">
        {{ currentAvaliableAskCountsTip }}
      </n-text>
    </div>-->

    <!-- 文件上传区域 -->
    <div v-if="props.uploadMode" v-show="showFileUpload" class="mx-4 mb-4">
      <FileUploadRegion ref="fileUploadRegionRef" :mode="props.uploadMode" :disabled="uploadDisabled" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LogoMarkdown, Print, Send, Stop } from '@vicons/ionicons5';
import {
  AttachFileFilled,
  DoubleArrowRound,
  FullscreenRound,
  KeyboardDoubleArrowDownRound,
  KeyboardDoubleArrowUpRound,
} from '@vicons/material';
import { useThemeVars } from 'naive-ui';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore, useFileStore } from '@/store';

import FileUploadRegion from './FileUploadRegion.vue';

const themeVars = useThemeVars();
const appStore = useAppStore();
const fileStore = useFileStore();
const { t } = useI18n();

const fileUploadRegionRef = ref<InstanceType<typeof FileUploadRegion>>();

const showFileUpload = ref<boolean>(false);

const props = defineProps<{
  canAbort: boolean;
  canContinue: boolean;
  sendDisabled: boolean;
  inputValue: string;
  autoScrolling: boolean;
  uploadMode: 'legacy_code_interpreter' | 'all' | null;
  uploadDisabled: boolean;
}>();

const sendDisabled = computed(() => {
  return props.sendDisabled || fileUploadRegionRef?.value?.isUploading;
});

const onPaste = (e: ClipboardEvent) => {
  if (props.uploadMode === null || props.uploadDisabled) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind !== 'file') continue;
    const file = items[i].getAsFile();
    if (!file) {
      console.error('Failed to get the file from clipboard.', items[i]);
      continue;
    }
    fileUploadRegionRef?.value?.addFile(file);
    showFileUpload.value = true;
    e.preventDefault();
  }
};

const autoScrolling = computed({
  get() {
    return props.autoScrolling;
  },
  set(value) {
    emits('update:auto-scrolling', value);
  },
});

const inputExpanded = ref<boolean>(false);
const inputStyle = computed(() => {
  if (!inputExpanded.value)
    return {
      height: 'auto',
      maxHeight: '16vh',
    };
  return {
    height: '30vh',
  };
});

const inputValue = computed({
  get() {
    return props.inputValue;
  },
  set(value) {
    emits('update:input-value', value);
  },
});

const emits = defineEmits<{
  (e: 'abort-request'): void;
  (e: 'continue-generating'): void;
  (e: 'send-msg'): void;
  (e: 'export-to-markdown-file'): void;
  (e: 'export-to-pdf-file'): void;
  (e: 'show-fullscreen-history'): void;
  (e: 'update:auto-scrolling', value: boolean): void;
  (e: 'update:input-value', value: string): void;
}>();

const toggleInputExpanded = () => {
  inputExpanded.value = !inputExpanded.value;
};

const shortcutSendMsg = (e: KeyboardEvent) => {
  if (sendDisabled.value) return;
  const sendKey = appStore.preference.sendKey; // "Shift+Enter" or "Ctrl+Enter" or "Enter"
  if (sendKey === 'Enter' && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.isComposing) {
    e.preventDefault();
    emits('send-msg');
  } else if (sendKey === 'Shift+Enter' && e.key === 'Enter' && e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    emits('send-msg');
  } else if (sendKey === 'Ctrl+Enter' && e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
    e.preventDefault();
    emits('send-msg');
  }
};
</script>

<style>
.n-divider {
  margin-bottom: 0px !important;
  margin-top: 0px !important;
}
</style>
