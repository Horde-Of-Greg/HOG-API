import { getGrokClient } from "../clients/GrokClient";
import { env } from "../config/config";
import { GrokTokenizeReq } from "../types/grok";
import { getLogger } from "./Logger";

export async function tokenizeGrok(
  text: string,
  model: string
): Promise<{ stringTokens: string[]; tokenCount: number } | null> {
  const response = await makeTokenizeReq(text, model);
  if (!response) {
    return null;
  }
  return {
    stringTokens: response.token_ids.map((token) => token.string_token),
    tokenCount: response.token_ids.length,
  };
}

async function makeTokenizeReq(
  text: string,
  model: string
): Promise<GrokTokenizeReq | null> {
  const response = await fetch(
    getGrokClient().client.baseURL + "/tokenize-text",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        text: text,
      }),
    }
  );

  if (!response.ok) {
    getLogger().simpleLog(
      "error",
      `Error tokenizing input with grok. ${response.status} ${response.statusText}`
    );
    return null;
  }

  return await response.json();
}
