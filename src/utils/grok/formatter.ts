import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { AiInputData } from "../../types/ai";
import { SystemPrompt } from "../../config/routes";
import { findDcUsernameById } from "../bot/usernames";
import { getDbHandler } from "../../db/DbHandler";
import {
  DEFAULT_PROMPT,
  HOGICHAN_PROMPT,
  NOMICORD_PROMPT,
} from "../../loaders/storage";

const SYSTEM_PROMPTS = {
  default: DEFAULT_PROMPT,
  hogichan: HOGICHAN_PROMPT,
  nomicord: NOMICORD_PROMPT,
} as const;

export function formatQuestion(
  discordUsername: string,
  rawQuestion: string,
  rawContext: string
) {
  const prefix = `Question by <user=${discordUsername}>:`;
  const question = filter(rawQuestion, discordUsername);
  const context = filter(rawContext, discordUsername);
  const body = `Context:\n${context}\n\nQuestion:\n${question}`;
  return `${prefix}\n${body}`;
}

function filter(text: string, discordUsername: string) {
  return text;
}

export async function formatCompletion(
  reqBody: AiInputData,
  model: string,
  type: SystemPrompt,
  modelName: string
): Promise<ChatCompletionCreateParamsNonStreaming> {
  const completion: ChatCompletionCreateParamsNonStreaming = {
    model: model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPTS[type],
      },
      {
        role: "user",
        content: formatQuestion(
          await getDbHandler().getUsername(reqBody.userId, modelName),
          reqBody.prompt,
          reqBody.context
        ),
      },
    ],
  };
  return completion;
}
