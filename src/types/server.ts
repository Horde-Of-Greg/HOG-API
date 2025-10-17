import { SystemPromptChoice } from "./grok";
import { EndpointConfig as ConfigEndpointConfig } from "../config/schema";

export type LogType = "success" | "info" | "warn" | "error" | "debug";

export type Filter = {
  pattern: RegExp;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
};

export type PatternConfig = {
  pattern: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
};

export type EndpointConfig = {
  // /source/master/child
  // /leveret/grok/nomicord
  source: string;
  main: string | null;
  child: string | null;
  config?: RequestEndpointConfig;
};

export type RequestEndpointConfig = {
  endpointName: string;
  systemPrompt: SystemPromptChoice;
  model: string;
  maxPromptTokens: number;
  maxContextTokens: number;
  maxTotalTokens: number;
  filters: string;
  rateLimit: ConfigEndpointConfig["RATE_LIMIT"];
};

export type EndpointLevel = "source" | "main" | "child";
