export type SystemPromptChoice = "default" | "hogichan" | "nomicord";

export type GrokInputData = {
  userId: string;
  prompt: string;
  context: string;
  attachement: string | null;
};

export type GrokOutputData = {
  completion: string;
  duration: number;
};
