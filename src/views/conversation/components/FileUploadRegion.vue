<template>
  <div class="flex flex-row lt-sm:flex-col sm:space-x-4 w-full">
    <n-upload
      ref="uploadAllRef"
      v-model:file-list="fileStore.naiveUiUploadFileInfos"
      multiple
      :custom-request="customRequest"
      :show-cancel-button="true"
      :show-remove-button="true"
      :show-retry-button="true"
      :on-remove="removeFile"
      list-type="image-card"
      :accept="acceptedMimeTypes.join(',')"
      :on-before-upload="checkFileBeforeUpload"
      :max="10"
    >
    </n-upload>
  </div>
</template>

<script setup lang="ts">
import { UploadFileRound } from '@vicons/material';
import axios from 'axios';
import { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';
import { v4 as uuidv4 } from 'uuid';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFileStore } from '@/store';
import { Message } from '@/utils/tips';

const { t } = useI18n();

const fileStore = useFileStore();

const uploadAllRef = ref();

// 修改为后端接受的MIME类型
const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];

const isImage = (file: File) => {
  return file.type.startsWith('image/');
};

const isSupportedImage = (file: File) => {
  return acceptedMimeTypes.includes(file.type);
};

const checkFileBeforeUpload = (options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const rawFile = options.file.file as File;
  if (!isSupportedImage(rawFile)) {
    Message.warning(t('tips.unsupportedImageFormat', [options.file.name]));
    return false;
  }
  // 可以根据需要调整文件大小限制
  if (rawFile.size > 1024 * 1024 * 1024) {
    Message.warning(t('tips.fileSizeTooLarge', [options.file.name]));
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
      Message.warning(t('tips.unsupportedImageFormat', [file.name]));
      onError();
      return;
    }

    onProgress({ percent: 0 });

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
    Message.success(t('tips.fileUploadSuccess', [file.name]));
    onFinish();
  } catch (error) {
    Message.error(
      t('tips.fileUploadFailed', [file.name]) + `: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      { duration: 5 * 1000 }
    );
    console.error(error);
    onError();
  }
};

const removeFile = async (options: { file: UploadFileInfo; fileList: Array<UploadFileInfo> }) => {
  const { file } = options;
  const fileId = fileStore.naiveUiFileIdToServerFileIdMap[file.id];
  if (fileId != undefined) {
    fileStore.uploadedFileInfos = fileStore.uploadedFileInfos.filter((uploadedFileInfo) => {
      return uploadedFileInfo.hash_name != fileId;
    });
    delete fileStore.naiveUiFileIdToServerFileIdMap[file.id];
    console.log(`Removed file ${file.name} with id ${fileId}`);
  }
  return true;
};

function addFile(file: File) {
  const fileId = uuidv4();
  const newFileInfo = {
    id: fileId,
    name: file.name,
    status: 'pending',
    file,
    type: file.type,
  } as UploadFileInfo;
  fileStore.naiveUiUploadFileInfos = [...fileStore.naiveUiUploadFileInfos, newFileInfo];
  console.log('addFile', fileStore.naiveUiUploadFileInfos);
  nextTick(() => {
    uploadAllRef.value?.submit();
  });
}

const isUploading = computed(() => {
  return fileStore.naiveUiUploadFileInfos.some((file) => file.status === 'uploading');
});

defineExpose({ isUploading, addFile });
</script>
