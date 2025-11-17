import { getGrokClient } from "../../clients/GrokClient";
import { config } from "../../config/config";
import { AiModel, SystemPrompt } from "../../config/routes";
import { AiInputData } from "../../types/ai";
import {
  DEFAULT_PROMPT,
  HOGICHAN_PROMPT,
  NOMICORD_PROMPT,
} from "../../loaders/storage";
import { formatCompletion } from "../../utils/grok/formatter";

const SYSTEM_PROMPTS = {
  default: DEFAULT_PROMPT,
  hogichan: HOGICHAN_PROMPT,
  nomicord: NOMICORD_PROMPT,
} as const;

export class GrokService {
  async generateCompletion(
    input: AiInputData,
    model: AiModel,
    systemPrompt: SystemPrompt
  ) {
    const modelConfig = config.ENDPOINTS[model];
    if (!modelConfig) {
      throw new Error(`Model configuration not found for ${model}`);
    }

    const completionParams = await formatCompletion(
      input,
      modelConfig.MODEL,
      systemPrompt,
      model
    );

    return await getGrokClient().client.chat.completions.create(
      completionParams
    );
  }

  getSystemPrompt(type: SystemPrompt): string {
    return SYSTEM_PROMPTS[type];
  }
}
