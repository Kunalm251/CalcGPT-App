export type ActiveTab = "calculator" | "handwriting" | "history" | "ai_search";

export type CalculatorMode = "standard" | "scientific" | "graphing";

export type AngleUnit = "deg" | "rad";

export type CalculationType = "standard" | "scientific" | "graphing" | "handwritten" | "ai_search";

export interface CalculationItem {
  id: string;
  expression: string;
  result: string;
  type: CalculationType;
  timestamp: number;
  isFavorite?: boolean;
  steps?: string[];
  explanation?: string;
  imageBase64?: string;
  title?: string;
  keyFormulas?: string[];
}

export interface AiSearchResult {
  title: string;
  expression?: string;
  result: string;
  steps: string[];
  explanation: string;
  keyFormulas?: string[];
}

export interface HandwritingResult {
  recognizedEquation: string;
  result: string;
  steps: string[];
  explanation: string;
  isMathEquation: boolean;
}

export type ThemeMode = "dark" | "light";

export interface ExportConfig {
  title: string;
  includeSteps: boolean;
  includeTimestamp: boolean;
  format: "pdf" | "png";
  scope: "current" | "history" | "canvas";
}
