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
import 'tiff.js';

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

const TIFF_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff', 'image/tif', '.tif', '.tiff'];
const acceptString = computed(() => acceptedMimeTypes.join(','));

const isSupportedImage = (file: File) => {
  const byMime = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff', 'image/tif'].includes(file.type);
  const byExt = /\.tiff?$/i.test(file.name);
  return byMime || byExt;
};

const isTiffFile = (file: File) =>
  file.type === 'image/tiff' || file.type === 'image/tif' || /\.tiff?$/i.test(file.name);
const isHeavyTiff = (file: File) => isTiffFile(file) && file.size > TIFF_SIZE_LIMIT;

const isTiffBuffer = (buf: ArrayBuffer) => {
  const v = new Uint8Array(buf);
  return (v[0] === 0x49 && v[1] === 0x49) || (v[0] === 0x4d && v[1] === 0x4d);
};

const processTiffImage = (buffer: ArrayBuffer, pageIndex = 0) => {
  const TiffCls = (window as any).Tiff;
  if (!TiffCls) throw new Error('tiff.js not loaded');
  TiffCls.initialize?.({ TOTAL_MEMORY: 16777216 * 10 });
  const tiff = new TiffCls({ buffer });
  try {
    const pages = tiff.countDirectory ? tiff.countDirectory() : 1;
    if (pages > 1 && pageIndex >= 0 && pageIndex < pages) tiff.setDirectory(pageIndex);
    const canvas: HTMLCanvasElement = tiff.toCanvas();
    return canvas.toDataURL('image/png');
  } finally {
    tiff.close?.();
  }
};

const buildTempThumbUrl = (hashName: string) => `/api/temp/${hashName}.png`;

const checkFileBeforeUpload = (options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const rawFile = options.file.file as File;
  if (!isSupportedImage(rawFile)) {
    Message.warning(t('tips.unsupportedImageFormat', [options.file.name]));
    return false;
  }
  if (rawFile.size > 1024 * 1024 * 1024) {
    Message.warning(t('tips.fileSizeTooLarge', [options.file.name]));
    return false;
  }
  return true;
};

const customRequest = async ({ file, onFinish, onError, onProgress }: UploadCustomRequestOptions) => {
  try {
    if (!file.file) throw new Error('Failed to get the file.');
    const rawFile = file.file as File;

    if (!isSupportedImage(rawFile)) {
      Message.warning(t('tips.unsupportedImageFormat', [file.name]));
      onError();
      return;
    }

    // 预览阶段
    if (isHeavyTiff(rawFile)) {
      // 大 TIF：不做前端解码，用透明像素当占位，等后端缩略图
      file.thumbnailUrl = TRANSPARENT_PX;
      file.url = TRANSPARENT_PX;
    } else {
      if (isTiffFile(rawFile)) {
        const buf = await rawFile.arrayBuffer();
        // 保险再判一次 buffer
        if (!isTiffBuffer(buf)) throw new Error('Invalid TIFF buffer');
        const dataUrl = processTiffImage(buf);
        file.thumbnailUrl = dataUrl;
        file.url = dataUrl;
      } else {
        // 其他图片：直接用 blob 预览
        const url = URL.createObjectURL(rawFile);
        file.thumbnailUrl = url;
        file.url = url;
      }
    }

    onProgress({ percent: 0 });

    // 上传阶段
    const formData = new FormData();
    formData.append('images', rawFile);

    const response = await axios.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          onProgress({ percent: percentCompleted });
        }
      },
    });

    if (response.status !== 200) throw new Error('Failed to upload the file.');

    const uploadedFileInfo = response.data[0];
    fileStore.uploadedFileInfos = [...fileStore.uploadedFileInfos, uploadedFileInfo];
    fileStore.naiveUiFileIdToServerFileIdMap[file.id] = uploadedFileInfo.hash_name;

    // 大 TIF：上传完成后直接切换为后端缩略图
    if (isHeavyTiff(rawFile)) {
      const thumbUrl = `${buildTempThumbUrl(uploadedFileInfo.hash_name)}?ts=${Date.now()}`;
      file.thumbnailUrl = thumbUrl;
      file.url = thumbUrl;
    }

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

  // 回收本地 blob URL
  if (file.url && file.url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(file.url);
    } catch {}
  }
  if (file.thumbnailUrl && file.thumbnailUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(file.thumbnailUrl);
    } catch {}
  }

  const fileId = fileStore.naiveUiFileIdToServerFileIdMap[file.id];
  if (fileId !== undefined) {
    fileStore.uploadedFileInfos = fileStore.uploadedFileInfos.filter((u) => u.hash_name !== fileId);
    delete fileStore.naiveUiFileIdToServerFileIdMap[file.id];
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
  nextTick(() => uploadAllRef.value?.submit());
}

const isUploading = computed(() => fileStore.naiveUiUploadFileInfos.some((f) => f.status === 'uploading'));

defineExpose({ isUploading, addFile, acceptString });
</script>
