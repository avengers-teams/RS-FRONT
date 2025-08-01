import { getFileDownloadUrlApi, getInterpreterSandboxFileDownloadUrlApi } from '@/api/conv';
import { i18n } from '@/i18n';
import {
  BaseChatMessage,
  ChatSourceTypes,
  OpenaiWebChatMessageMetadataCiteData,
  OpenaiWebChatMessageMultimodalTextContent,
  OpenaiWebChatMessageMultimodalTextContentImagePart,
  OpenaiWebChatMessageTextContent,
} from '@/types/schema';
import { getTextMessageContent } from '@/utils/chat';
import { Dialog } from '@/utils/tips';

const t = i18n.global.t as any;

export type DisplayItemType = 'text' | 'multimodal_text' | null;

export type DisplayItem = {
  type: DisplayItemType;
  messages: BaseChatMessage[];
};

export function determineMessageType(group: BaseChatMessage[]): DisplayItemType | null {
  let displayType: DisplayItemType | null = null;
  const textOrMultimodal = (message: BaseChatMessage) => {
    if (message.content?.content_type == 'text') {
      return 'text';
    } else if (message.content?.content_type == 'multimodal_text') {
      return 'multimodal_text';
    }
    return null;
  };

  for (const message of group) {
    if (message.role == 'assistant') {
      displayType = textOrMultimodal(message);
      break;
    }
    if (message.id.startsWith('temp_')) {
      displayType = textOrMultimodal(message);
      break;
    }
    if (message.role == 'user') {
      displayType = textOrMultimodal(message);
      break;
    }
  }

  if (!displayType) console.error('cannot find display type for group', group);
  return displayType;
}

export function buildTemporaryMessage(
  source: ChatSourceTypes,
  role: string,
  textContent: string,
  parent: string | undefined,
  model: string | undefined,
  openaiWebMultimodalImageParts: OpenaiWebChatMessageMultimodalTextContentImagePart[] | null = null
) {
  const random_strid = Math.random().toString(36).substring(2, 16);
  const content = {
    content_type: 'text',
    parts: [textContent],
  };
  const result = {
    id: `temp_${random_strid}`,
    source,
    content,
    role: role,
    parent, // 其实没有用到parent
    children: [],
    model,
    create_time: new Date().toISOString(),
  } as BaseChatMessage;
  if (openaiWebMultimodalImageParts) {
    result.content = {
      content_type: 'multimodal_text',
      parts: [...openaiWebMultimodalImageParts, textContent],
    } as OpenaiWebChatMessageMultimodalTextContent;
  }
  return result;
}

export function modifiyTemporaryMessageContent(message: BaseChatMessage, textContent: string) {
  if (message.content?.content_type != 'text') {
    console.error('wrong content type in temporary openai_api message', message);
    return message.content;
  }
  const content = message.content as OpenaiWebChatMessageTextContent | OpenaiWebChatMessageMultimodalTextContent;
  content.parts = [textContent];
  return content;
}

function htmlToElement(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

export function processCitations(contentDiv: HTMLDivElement) {
  const citationEls = contentDiv!.querySelectorAll('span.browsing-citation');
  const citationUrls = [] as string[];
  citationEls.forEach((el) => {
    const metadata = JSON.parse(
      decodeURIComponent(el.getAttribute('data-citation') || '')
    ) as OpenaiWebChatMessageMetadataCiteData;
    if (!metadata) return;
    let citationIndex = 0;
    if (citationUrls.includes(metadata.url!)) {
      citationIndex = citationUrls.indexOf(metadata.url!) + 1;
    } else {
      citationUrls.push(metadata.url!);
      citationIndex = citationUrls.length;
    }
    const newEl = htmlToElement(
      `<a href="${metadata.url!}" target="_blank" rel="noreferrer" class="px-0.5 text-green-600 !no-underline"><sup>${citationIndex}</sup></a>`
    );
    if (newEl) el.replaceWith(newEl);
  });
}

function findMessageIdOfSandboxFile(sandboxPath: string, messages: BaseChatMessage[]) {
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const content = getTextMessageContent([message]);
    // console.log(`search ${sandboxPath} in ${content}`);
    if (content.includes(sandboxPath)) {
      return message.id;
    }
  }
  return null;
}

function getSandboxLinkClickHandler(conversationId: string, messages: BaseChatMessage[]) {
  return (event: Event) => {
    const target = event.target as HTMLElement;

    if (target && target.matches('a.sandbox')) {
      event.preventDefault();

      // 设置元素禁止点击
      target.style.pointerEvents = 'none';

      const path = target.getAttribute('data-path');
      const messageId = findMessageIdOfSandboxFile(path!, messages);
      if (!path) return;
      if (!messageId) return;

      getInterpreterSandboxFileDownloadUrlApi(conversationId, messageId, path)
        .then((response) => {
          const url = response.data;
          window.open(url, '_blank');
        })
        .catch((e) => {
          console.error(e);
          if (e.message == 'errors.resourceNotFound') {
            Dialog.warning({
              content: t('tips.sandboxFileNotFound', [path]),
            });
          } else {
            Dialog.error({
              title: 'Error',
              content: t('tips.sandboxFileDownloadError'),
            });
          }
        })
        .finally(() => {
          target.style.pointerEvents = 'auto';
        });
    }
  };
}

export function processSandboxLinks(contentDiv: HTMLDivElement, conversationId: string, messages: BaseChatMessage[]) {
  const sandboxLinks = contentDiv.querySelectorAll('a[href^="sandbox:"]');

  sandboxLinks.forEach((link) => {
    link.classList.add('sandbox');
    const hrefValue = link.getAttribute('href');
    const path = hrefValue?.replace('sandbox:', '');
    link.setAttribute('data-path', path || '');
    const clickHandler = getSandboxLinkClickHandler(conversationId, messages);
    link.addEventListener('click', clickHandler);
  });
}

export async function getImageDownloadUrlFromFileServiceSchemaUrl(url: string | undefined | null) {
  if (!url || !url.startsWith('file-service://')) return null;
  try {
    const response = await getFileDownloadUrlApi(url.split('file-service://')[1]);
    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}
