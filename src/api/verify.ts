import axios from 'axios';
import { BaseConversationHistory } from '@/types/schema';
import ApiUrl from '@/api/url';

export function getVerifyLogFilesApi() {
  return axios.get(`${ApiUrl.VerifyLogFiles}`);
}

export function getVerifyLogApi(options: any) {
  return axios.post(`${ApiUrl.VerifyLog}`, options);
}
