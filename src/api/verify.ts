import axios from 'axios';
export type VerifyTreeType = 'all' | 'floder' | 'folder' | 'json' | string;

export interface GetVerifyTreeParams {
  type?: VerifyTreeType;
  relpath?: string;
  include_root?: boolean;
}
import ApiUrl from '@/api/url';

export function getVerifyLogFilesApi() {
  return axios.get(`${ApiUrl.VerifyLogFiles}`);
}

export function getVerifyLogApi(options: any) {
  return axios.post(`${ApiUrl.VerifyLog}`, options);
}

export function getVerifyTreeApi(params: GetVerifyTreeParams) {
  return axios.get(ApiUrl.VerifyUnpackedTree, { params });
}
