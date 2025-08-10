import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { GrokController } from "../controllers/GrokController";
import { GrokInputData, SystemPromptChoice } from "../types/grok";
import { findDcUsernameById } from "./discordUtil";
import { getDbHandler } from "../db/DbHandler";

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
  req: GrokInputData,
  type: SystemPromptChoice
): Promise<ChatCompletionCreateParamsNonStreaming> {
  const completion: ChatCompletionCreateParamsNonStreaming = {
    model: "grok-3-mini",
    messages: [
      {
        role: "system",
        content: GrokController.systemPromptMappings[type],
      },
      {
        role: "user",
        content: formatQuestion(
          await getDbHandler().getUsername(req.userId),
          req.prompt,
          req.context
        ),
      },
    ],
  };
  return completion;
}
