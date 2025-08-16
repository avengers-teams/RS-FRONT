<template>
  <div class="mb-4 flex flex-col">
    <div class="flex gap-9xl">
      <n-upload
        action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
        :headers="{
          'naive-info': 'hello!',
        }"
        :data="{
          'naive-data': 'cool! naive!',
        }"
      >
        <n-button>上传数据集</n-button>
      </n-upload>
      <n-button type="primary" @click="onCreateVerify">新建测试任务</n-button>
    </div>
    <div class="flex flex-col">
      <!-- 设置 -->
      <div class="flex flex-row mt-3 justify-between">
        <div class="flex flex-wrap flex-row sm:space-x-3">
          <div class="option-item">
            <n-text>行数</n-text>
            <n-input-number v-model:value="maxLineCount" size="small" class="w-27" :min="100" :max="2000" :step="100" />
          </div>
          <div class="option-item">
            <n-text>刷新间隔</n-text>
            <n-select
              v-model:value="refresh_duration"
              size="small"
              class="w-20"
              :options="[
                { label: '3s', value: 3 },
                { label: '5s', value: 5 },
                { label: '10s', value: 10 },
              ]"
            />
          </div>
          <div class="option-item">
            <n-text>选择查看日志</n-text>
            <n-select v-model:value="logFile" size="small" class="w-32" :options="logFileOptions" />
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <n-text>自动滚动</n-text>
          <n-switch v-model:value="enableAutoScroll" size="small" />
        </div>
      </div>
      <n-card class="mt-3 flex-grow h-full" :content-style="{ height: '100%' }">
        <n-log ref="logInstRef" :font-size="10" :rows="40" :lines="logsContent" />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';

import { getVerifyLogApi, getVerifyLogFilesApi, runVerifyApi } from '@/api/verify';
import { NewVerificationInfo } from '@/types/custom';
import { popupNewVerifyDialog } from '@/utils/renders';

const refresh_duration = ref(5);
const logsContent = ref<Array<string>>();
const enableAutoScroll = ref(true);
const maxLineCount = ref(100);

const logInstRef = ref();
const logFileOptions = ref();
getVerifyLogFilesApi().then((res) => {
  logFileOptions.value = res.data;
});
const logFile = ref('verify.log');

watch(
  () => maxLineCount.value,
  () => {
    loadLogs();
  }
);

const scrollToBottom = () => {
  nextTick(() => {
    logInstRef.value?.scrollTo({ position: 'bottom', slient: false });
  });
};

const loadLogs = () => {
  getVerifyLogApi({
    verify_log_name: logFile.value,
    max_lines: maxLineCount.value,
  }).then((res) => {
    logsContent.value = res.data;
  });
  if (enableAutoScroll.value) {
    scrollToBottom();
  }
};

const onCreateVerify = () => {
  popupNewVerifyDialog(async (data: NewVerificationInfo) => {
    runVerifyApi(data).then((res) => {
      if (res.status === 200) {
        getVerifyLogFilesApi().then((res) => {
          logFileOptions.value = res.data;
          logFile.value = res.data[0].value;
        });
        loadLogs();
      }
    });
  });
};

loadLogs();
let interval = setInterval(() => {
  loadLogs();
}, refresh_duration.value * 1000);

onUnmounted(() => {
  clearInterval(interval);
});

watch(
  () => refresh_duration.value,
  () => {
    clearInterval(interval);
    interval = setInterval(() => {
      loadLogs();
    }, refresh_duration.value * 1000);
  }
);
watch(
  () => logFile.value,
  () => {
    loadLogs();
  }
);
</script>

<style>
.option-item {
  @apply flex flex-row space-x-2 items-center mr-1 my-1;
}
</style>
