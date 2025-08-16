import { components } from './openapi';

export type UserRead = components['schemas']['UserRead'];
export type UserReadAdmin = components['schemas']['UserReadAdmin'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserUpdateAdmin = components['schemas']['UserUpdateAdmin'];

export type OpenaiWebChatMessageTextContent = components['schemas']['OpenaiWebChatMessageTextContent'];
export type OpenaiWebChatMessageMultimodalTextContent =
  components['schemas']['OpenaiWebChatMessageMultimodalTextContent'];

export type OpenaiWebChatMessageMultimodalTextContentImagePart =
  components['schemas']['OpenaiWebChatMessageMultimodalTextContentImagePart-Input'];

export type BaseChatMessage = components['schemas']['BaseChatMessage'];

export type BaseConversationSchema = components['schemas']['BaseConversationSchema'];

export type BaseConversationHistory = components['schemas']['BaseConversationHistory'];

export type AskRequest = components['schemas']['AskRequest'];
export type AskResponse = components['schemas']['AskResponse'];
