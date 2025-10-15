import { z } from "zod";

export const GrokInputDataSchema = z.object({
  userId: z.string().min(1, "userId cannot be empty"),
  prompt: z
    .string()
    .min(1, "prompt cannot be empty")
    .max(10000, "prompt too long"),
  context: z.string().max(5000, "context too long"),
  attachement: z.url("attachement must be a valid URL").nullable(),
});

export type GrokInputData = z.infer<typeof GrokInputDataSchema>;
export type SystemPromptChoice = "default" | "hogichan" | "nomicord";
