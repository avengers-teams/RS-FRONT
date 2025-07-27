import { components } from './openapi';

export type ChatSourceTypes = components['schemas']['ChatSourceTypes'];

export type UserRead = components['schemas']['UserRead'];
export type UserReadAdmin = components['schemas']['UserReadAdmin'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserUpdateAdmin = components['schemas']['UserUpdateAdmin'];

export type UserSettingSchema = components['schemas']['UserSettingSchema-Input'];

export type OpenaiWebChatMessageMetadata = components['schemas']['OpenaiWebChatMessageMetadata'];
export type OpenaiWebChatMessageMetadataAttachment = components['schemas']['OpenaiWebChatMessageMetadataAttachment'];
export type OpenaiWebChatMessageTextContent = components['schemas']['OpenaiWebChatMessageTextContent'];
export type OpenaiWebChatMessageMultimodalTextContent =
  components['schemas']['OpenaiWebChatMessageMultimodalTextContent'];
export type OpenaiWebChatMessageCodeContent = components['schemas']['OpenaiWebChatMessageCodeContent'];
export type OpenaiWebChatMessageStderrContent = components['schemas']['OpenaiWebChatMessageStderrContent'];
export type OpenaiWebChatMessageTetherBrowsingDisplayContent =
  components['schemas']['OpenaiWebChatMessageTetherBrowsingDisplayContent'];
export type OpenaiWebChatMessageMetadataCiteData = components['schemas']['OpenaiWebChatMessageMetadataCiteData'];
export type OpenaiWebChatMessageTetherQuoteContent = components['schemas']['OpenaiWebChatMessageTetherQuoteContent'];
export type OpenaiWebChatMessageSystemErrorContent = components['schemas']['OpenaiWebChatMessageSystemErrorContent'];
export type OpenaiApiChatMessageTextContent = components['schemas']['OpenaiApiChatMessageTextContent'];
export type OpenaiWebChatMessageMultimodalTextContentImagePart =
  components['schemas']['OpenaiWebChatMessageMultimodalTextContentImagePart-Input'];

export type BaseChatMessage = components['schemas']['BaseChatMessage'];
export type OpenaiChatInterpreterInfo = components['schemas']['OpenaiChatInterpreterInfo'];

export type BaseConversationSchema = components['schemas']['BaseConversationSchema'];

export type BaseConversationHistory = components['schemas']['BaseConversationHistory'];

export type AskRequest = components['schemas']['AskRequest'];
export type AskResponse = components['schemas']['AskResponse'];

export type UploadedFileInfoSchema = components['schemas']['UploadedFileInfoSchema'];
export type StartUploadRequestSchema = components['schemas']['StartUploadRequestSchema'];
export type StartUploadResponseSchema = components['schemas']['StartUploadResponseSchema'];
