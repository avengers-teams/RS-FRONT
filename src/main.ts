import './style.css';

import 'uno.css';
import '@/api/interceptor';
import 'katex/dist/katex.css';

import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NPopover,
  NSelect,
  NSpace,
  NSwitch,
  NTimePicker,
} from 'naive-ui';
import { createApp } from 'vue';

import App from './App.vue';
import { i18n } from './i18n';
import router from './router';
import pinia from './store';

const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(i18n);

// 注册部分naive-ui组件，以供vue-form使用
const naiveFormComponents = [
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NButton,
  NSelect,
  NPopover,
  NCheckbox,
  NCheckboxGroup,
  NSpace,
  NDatePicker,
  NTimePicker,
];
naiveFormComponents.forEach((component) => {
  app.component(`N${component.name}`, component);
});

app.mount('#app');

declare global {
  interface Window {
    $message: any;
  }
}
