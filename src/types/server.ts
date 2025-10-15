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
