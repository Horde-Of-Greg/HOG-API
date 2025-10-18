import OpenAI from "openai";
import { config, env } from "../config/config";
import { getLogger } from "../utils/Logger";

let grokClient: GrokClient | null = null;

export class GrokClient {
  client: OpenAI;

  constructor() {
    this.client = this.buildClient();
  }

  buildClient() {
    getLogger().simpleLog("success", "Building Grok Client");
    return new OpenAI({
      apiKey: env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
      timeout: config.GROK_TIMEOUT,
    });
  }
}

export function initGrokClient(): GrokClient {
  if (grokClient) return grokClient;
  grokClient = new GrokClient();
  return grokClient;
}

export function getGrokClient(): GrokClient {
  if (!grokClient)
    throw new Error(
      "Grok Client not initialized. Call initGrokClient() first."
    );
  return grokClient;
}
