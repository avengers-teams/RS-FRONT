import axios from 'axios';

import { StartUploadRequestSchema, StartUploadResponseSchema, UploadedFileInfoSchema } from '@/types/schema';

import ApiUrl from './url';

export function uploadFileToLocalApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(ApiUrl.FilesLocalUpload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function startUploadFileToOpenaiWeb(uploadRequest: StartUploadRequestSchema) {
  return axios.post<StartUploadResponseSchema>(ApiUrl.FilesOpenaiWebUploadStart, uploadRequest);
}

export function completeUploadFileToOpenaiWeb(uploadId: string) {
  return axios.post<UploadedFileInfoSchema>(`${ApiUrl.FilesOpenaiWebUploadComplete}/${uploadId}`);
}

export function requestUploadFileFromLocalToOpenaiWeb(fileId: string) {
  return axios.post<UploadedFileInfoSchema>(`${ApiUrl.FilesLocalUploadToOpenaiWeb}/${fileId}`);
}

export async function uploadFileToAzureBlob(
  file: File,
  signedUrl: string,
  onProgress: (e: { percent: number }) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress({ percent });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        console.log('File uploaded successfully to azure', File);
        resolve();
      } else {
        console.error(`Failed to upload file to azure: ${xhr.status} ${xhr.statusText}`);
        reject(new Error(`${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      console.error('An error occurred while uploading the file to azure', file);
      reject(new Error('An error occurred while uploading the file to azure'));
    });

    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('x-ms-version', '2020-04-08');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.send(file);
  });
}
