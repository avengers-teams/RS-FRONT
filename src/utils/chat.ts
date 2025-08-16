import DOMPurify from 'dompurify';

import {
  BaseChatMessage,
  BaseConversationHistory,
  OpenaiWebChatMessageMultimodalTextContent,
  OpenaiWebChatMessageMultimodalTextContentImagePart,
} from '@/types/schema';

export const taskTypeMap: Record<string, string> = {
  1: '图像语义生成',
  2: '目标识别与计数',
  3: '空间感知与定位',
  4: '地物分类与状态评估',
  5: '场景推理与决策',
};

export const getContentRawText = (message: BaseChatMessage | null): string => {
  if (!message || !message.content) return '';
  if (message.content.content_type) {
    const content = message.content;
    return content.parts ? content.parts[0] : content.text || '';
  } else {
    const content = message.content;
    for (const part of content) {
      if (part.content_type == 'text') return part.text;
    }
    return '';
  }
};

export const getMultimodalContentImageParts = (
  message: BaseChatMessage | null
): OpenaiWebChatMessageMultimodalTextContentImagePart[] => {
  if (!message || !message.content) return [];
  if (message.content.content_type == 'multimodal_text') {
    const content = message.content as OpenaiWebChatMessageMultimodalTextContent;
    return content.parts!.filter((part: any) => {
      return typeof part !== 'string';
    });
  }
  return [];
};

export function getMessageListFromHistory(
  convHistory: BaseConversationHistory | undefined | null,
  lastNode: string | null = null
): BaseChatMessage[] {
  const result: BaseChatMessage[] = [];
  if (!convHistory) return result;
  let x = lastNode || convHistory.current_node || (undefined as any);
  while (x != undefined) {
    const message = convHistory.mapping[x];
    if (message && message.content != undefined) {
      result.push(message);
      x = message.parent;
    } else {
      break;
    }
  }
  result.reverse();
  return result;
}

// 用于按照连续消息分组，end_turn为true时截断
export function mergeContinuousMessages(messages: BaseChatMessage[]): BaseChatMessage[][] {
  const result = [] as BaseChatMessage[][];
  let currentMessageList = [] as BaseChatMessage[];
  for (const message of messages) {
    if (currentMessageList.length > 0) {
      result.push(currentMessageList);
      currentMessageList = [];
    }
    result.push([message]);
  }
  if (currentMessageList.length > 0) {
    result.push(currentMessageList);
  }
  return result;
}

export function splitMessagesInGroup(messages: BaseChatMessage[]): BaseChatMessage[][] {
  const result = [] as BaseChatMessage[][];
  let currentMessageList = [] as BaseChatMessage[];
  for (const message of messages) {
    if (currentMessageList.length > 0) {
      result.push(currentMessageList);
      currentMessageList = [];
    }
    result.push([message]);
  }
  if (currentMessageList.length > 0) {
    result.push(currentMessageList);
  }
  return result;
}

export function getTextMessageContent(messages: BaseChatMessage[]) {
  let result = '';
  // 遍历 props.messages
  // 如果 message.content.content_type == 'text' 则加入 result，其它跳过
  // 对于 GPT-4-browsing 的引用，转换为 span
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i] as BaseChatMessage;
    if (!message || !message.content) continue;
    else if (typeof message.content == 'string') result += message.content;
    else if (message.content.content_type == 'text') {
      const text = getContentRawText(message);
      result += text;
    }
  }
  result = replaceMathDelimiters(result);
  return result;
}

export function replaceMathDelimiters(input: string) {
  let output = '';
  let pos = 0;
  let isCodeBlock = false,
    isCodeInline = false;
  const nextChar = (n: number) => {
    if (pos + n >= input.length) return '';
    else return input.charAt(pos + n);
  };

  while (pos < input.length) {
    const c = input.at(pos);
    if (c === '\\' && !isCodeBlock && !isCodeInline) {
      if (nextChar(1) === '(' || nextChar(1) === '[') {
        const isInline = nextChar(1) === '(';
        const endMarker = isInline ? '\\)' : '\\]';
        const endPos = input.indexOf(endMarker, pos + 2);
        if (endPos >= 0) {
          output += isInline ? '$' : '\n$$\n';
          output += input.substring(pos + 2, endPos).trim();
          output += isInline ? '$' : '\n$$\n';
          pos = endPos + endMarker.length;
          continue;
        }
      }
    } else if (c === '`') {
      const isCodeBlockDelimiter = nextChar(1) === '`' && nextChar(2) === '`';
      if (isCodeBlockDelimiter) {
        if (isCodeBlock) {
          isCodeBlock = false;
        } else if (isCodeInline) {
          isCodeInline = false;
          isCodeBlock = true;
        } else {
          isCodeBlock = true;
        }
        output += '```';
        pos += 3;
        continue;
      } else {
        if (isCodeInline) {
          isCodeInline = false;
        } else {
          isCodeInline = true;
        }
      }
    }
    output += input.charAt(pos);
    pos++;
  }
  return output.replace(/\n\n\n+/g, '\n\n');
}

export function dompurifyRenderedHtml(html: string) {
  return DOMPurify.sanitize(html, { ALLOW_UNKNOWN_PROTOCOLS: true });
}
