<!-- src/components/dialogs/NewVerificationForm.vue -->
<template>
  <div class="mt-4">
    <n-form :label-placement="'left'" :label-align="'left'" label-width="100px">
      <n-form-item label="目录">
        <n-space vertical style="width: 100%">
          <n-tree-select
            v-model:value="form.image_root"
            :options="folderOptions"
            :loading="loadingFolder"
            clearable
            filterable
            block-line
            :show-path="true"
            placeholder="请选择目录"
          />
          <n-button size="small" quaternary :loading="loadingFolder" @click="loadFolder"> 重新加载目录 </n-button>
        </n-space>
      </n-form-item>

      <n-form-item label="JSON 文件">
        <n-space vertical style="width: 100%">
          <n-tree-select
            v-model:value="form.filepath"
            :options="jsonOptions"
            :loading="loadingJson"
            clearable
            filterable
            block-line
            :show-path="true"
            placeholder="请选择 JSON 文件"
            :override-default-node-click-behavior="override"
          />
          <n-button size="small" quaternary :loading="loadingJson" @click="loadJson"> 重新加载 JSON </n-button>
        </n-space>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { TreeSelectOverrideNodeClickBehavior } from 'naive-ui';
import { onMounted, ref, watch } from 'vue';

import { getVerifyTreeApi } from '@/api/verify';
import type { NewVerificationInfo } from '@/types/custom';

type TreeNode = {
  label: string;
  key: string; // 后端返回的相对路径
  children?: TreeNode[];
  disabled?: boolean;
};

const emits = defineEmits<{
  (e: 'input', v: NewVerificationInfo): void;
}>();

// 直接使用后端需要的字段名，避免额外映射
const form = ref<NewVerificationInfo>({
  image_root: '', // 目录 key
  filepath: '', // JSON 文件 key
});

const folderOptions = ref<TreeNode[]>([]);
const jsonOptions = ref<TreeNode[]>([]);
const loadingFolder = ref(false);
const loadingJson = ref(false);

// JSON 选择器：父节点只展开、叶子可选
const override: TreeSelectOverrideNodeClickBehavior = ({ option }) => {
  if ((option as any).children) return 'toggleExpand';
  return 'default';
};

const loadFolder = async () => {
  loadingFolder.value = true;
  try {
    const { data } = await getVerifyTreeApi({ type: 'folder' });
    folderOptions.value = data;
  } finally {
    loadingFolder.value = false;
  }
};

const loadJson = async () => {
  loadingJson.value = true;
  try {
    const { data } = await getVerifyTreeApi({ type: 'json' });
    jsonOptions.value = data;
  } finally {
    loadingJson.value = false;
  }
};

watch(
  () => ({ ...form.value }),
  (val) => emits('input', val),
  { deep: true, immediate: true }
);

onMounted(() => {
  loadFolder();
  loadJson();
});
</script>
