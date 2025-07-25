import modelDefinitions from './json/model_definitions.json';
import { OpenaiApiChatModels, OpenaiWebChatModels } from './schema';

export const openaiWebChatModelNames = modelDefinitions.openai_web as OpenaiWebChatModels[];
export const openaiApiChatModelNames = modelDefinitions.openai_api as OpenaiApiChatModels[];
export const allChatModelNames = [...openaiWebChatModelNames, ...openaiApiChatModelNames] as string[];
