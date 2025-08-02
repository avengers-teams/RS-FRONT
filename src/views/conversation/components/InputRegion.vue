<template>
  <div class="input-container" :style="{ background: themeVars.baseColor }">
    <div v-show="showFileUpload" class="file-upload-region">
      <FileUploadRegion ref="fileUploadRegionRef" />
    </div>

    <div class="input-region">
      <!-- 输入框区域 -->
      <div class="input-wrapper">
        <n-input
          ref="inputRef"
          v-model:value="inputValue"
          class="chat-input"
          type="textarea"
          :bordered="true"
          :placeholder="$t('tips.sendMessage', [appStore.preference.sendKey])"
          :autosize="{ minRows: 1, maxRows: 5 }"
          :style="inputStyle"
          @keydown="shortcutSendMsg"
          @paste="onPaste"
        >
          <template #suffix>
            <div class="action-buttons">
              <!-- 文件上传按钮 -->
              <n-badge
                v-if="appStore.currentTaskType !== 2"
                :value="fileStore.uploadedFileInfos.length"
                :max="99"
                :offset="[-6, 3]"
              >
                <n-button class="action-btn" quaternary circle @click="showFileUpload = !showFileUpload">
                  <template #icon>
                    <n-icon><AttachFileFilled /></n-icon>
                  </template>
                </n-button>
              </n-badge>

              <!-- 发送按钮 -->
              <n-button :disabled="sendDisabled" class="send-btn" type="primary" circle @click="emits('send-msg')">
                <template #icon>
                  <n-icon><Send /></n-icon>
                </template>
              </n-button>
            </div>
          </template>
        </n-input>
      </div>

      <!-- 文件上传区域 -->
    </div>
  </div>
</template>
<style scoped>
.n-divider {
  margin-bottom: 0px !important;
  margin-top: 0px !important;
}

.input-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.input-region {
  max-width: 768px;
  width: 100%;
  margin: 0 auto;
}

.input-wrapper {
  position: relative;
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  background-color: white;
  transition: all 0.2s ease;
}

.chat-input {
  width: 100%;
  min-height: 52px;
  max-height: 200px;
  border-radius: 0.75rem;
  resize: none;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.5rem;
}

.action-btn {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload-region {
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.02);
}

.input-footer {
  margin: 0.5rem auto 1rem;
  max-width: 768px;
  width: 100%;
  padding: 0 1rem;
}
</style>

<script setup lang="ts">
import { Send } from '@vicons/ionicons5';
import { AttachFileFilled } from '@vicons/material';
import { useThemeVars } from 'naive-ui';
import { computed, ref } from 'vue';

import { useAppStore, useFileStore } from '@/store';

import FileUploadRegion from './FileUploadRegion.vue';

const themeVars = useThemeVars();
const appStore = useAppStore();
const fileStore = useFileStore();

const fileUploadRegionRef = ref<InstanceType<typeof FileUploadRegion>>();

const showFileUpload = ref<boolean>(false);

const props = defineProps<{
  canAbort: boolean;
  canContinue: boolean;
  sendDisabled: boolean;
  inputValue: string;
  autoScrolling: boolean;
  uploadDisabled: boolean;
}>();

const sendDisabled = computed(() => {
  return props.sendDisabled || fileUploadRegionRef?.value?.isUploading;
});

const onPaste = (e: ClipboardEvent) => {
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

const inputExpanded = ref<boolean>(false);
const inputStyle = computed(() => {
  if (!inputExpanded.value)
    return {
      height: 'auto',
      maxHeight: '16vh',
      minHeight: '75px',
      fontSize: '17px',
    };
  return {
    height: '30vh',
    minHeight: '75px',
    fontSize: '17px',
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
  (e: 'send-msg'): void;
  (e: 'update:input-value', value: string): void;
}>();

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
