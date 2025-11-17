export const AI_MODELS = ["grok", "premium-grok"] as const;
export type AiModel = (typeof AI_MODELS)[number];

export const SYSTEM_PROMPTS = ["default", "hogichan", "nomicord"] as const;
export type SystemPrompt = (typeof SYSTEM_PROMPTS)[number];

export const OREDIC_PACKS = ["nomi-ceu"] as const;
export type OredicPack = (typeof OREDIC_PACKS)[number];

export const OREDIC_ACTIONS = ["simplify", "match", "parse"] as const;
export type OredicAction = (typeof OREDIC_ACTIONS)[number];
