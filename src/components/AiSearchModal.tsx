import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VoiceSearchButton } from "./VoiceSearchButton";
import { AudioSolutionReader } from "./AudioSolutionReader";
import { StepAccordion } from "./StepAccordion";
import {
  Sparkles,
  Search,
  Check,
  Copy,
  FileDown,
  Loader2,
  BookOpen,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { AiSearchResult, CalculationItem, ThemeMode } from "../types";
import { exportCalculationPdf } from "../utils/exportUtils";

interface AiSearchModalProps {
  initialQuery?: string;
  onSaveCalculation: (item: Omit<CalculationItem, "id" | "timestamp">) => void;
  onSelectResultToCalc: (result: string) => void;
  theme?: ThemeMode;
}

export const AiSearchModal: React.FC<AiSearchModalProps> = ({
  initialQuery = "",
  onSaveCalculation,
  onSelectResultToCalc,
  theme = "dark",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AiSearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleQueries = [
    "Derivative of f(x) = x^3 * e^(2x)",
    "Integral of sin(x)^2 dx",
    "Calculate future value of $10000 invested at 7% for 10 years",
    "Roots of quadratic equation 2x^2 + 5x - 12 = 0",
    "Formula for standard deviation and variance",
    "Calculate gravitational potential energy of 5kg object at 10m height",
  ];

  const handleSearch = async (searchPrompt: string) => {
    if (!searchPrompt.trim()) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMsg(
        "Offline Mode Active: AI Assistant queries require network connection. Standard & Scientific Calculator tools, History log, and PDF export function offline!"
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSearchResult(null);

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchPrompt }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to solve AI query");
      }

      const resData: AiSearchResult = data;
      setSearchResult(resData);

      // Save to History Log
      onSaveCalculation({
        expression: resData.expression || searchPrompt,
        result: resData.result,
        type: "ai_search",
        steps: resData.steps,
        explanation: resData.explanation,
        title: resData.title,
        keyFormulas: resData.keyFormulas,
      });
    } catch (err: any) {
      console.error("AI Search Error:", err);
      setErrorMsg(err?.message || "Search query failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (searchResult) {
      exportCalculationPdf(
        [
          {
            id: "ai-1",
            expression: searchResult.expression || query,
            result: searchResult.result,
            type: "ai_search",
            timestamp: Date.now(),
            steps: searchResult.steps,
            explanation: searchResult.explanation,
            title: searchResult.title,
          },
        ],
        `AI Math Query - ${searchResult.title}`
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Input Box - Frosted Glass Card */}
      <div
        className={`border backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl space-y-4 transition-colors duration-200 ${
          theme === "light"
            ? "bg-white/90 border-slate-200 shadow-slate-200/60"
            : "bg-white/5 border-white/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`font-bold text-base sm:text-lg ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              AI Math & Science Assistant
            </h2>
            <p
              className={`text-xs ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Ask any mathematical question, step-by-step calculus, or science formula
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2.5 pt-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Integral of x^2 * sin(x), Quadratic formula..."
              className={`w-full pl-11 pr-12 py-3 text-xs sm:text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
                theme === "light"
                  ? "bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200"
                  : "bg-white/5 text-white placeholder:text-slate-500 border-white/10"
              }`}
            />
            <div className="absolute right-3 top-2.5">
              <VoiceSearchButton
                buttonId="modal-voice-search-mic-btn"
                onTranscript={(text) => {
                  setQuery((prev) => (prev ? `${prev} ${text}` : text));
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 border border-blue-500 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ask Gemini AI</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Sample Prompts */}
        <div
          className={`pt-3 border-t ${
            theme === "light" ? "border-slate-100" : "border-white/10"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${
              theme === "light" ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Try Preset Math Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(prompt);
                  handleSearch(prompt);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                  theme === "light"
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 dark:text-rose-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Results Display - Frosted Glass Card */}
      <AnimatePresence>
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`border backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl space-y-4 transition-colors duration-200 ${
              theme === "light"
                ? "bg-white/90 border-slate-200 shadow-slate-200/60"
                : "bg-white/5 border-white/10"
            }`}
          >
            {/* Result Header */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                theme === "light" ? "border-slate-100" : "border-white/10"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                  AI Math Breakdown
                </span>
                <h3
                  className={`font-bold text-base ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}
                >
                  {searchResult.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className={`px-3.5 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    theme === "light"
                      ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      : "bg-white/10 hover:bg-white/15 border-white/10 text-blue-300"
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(searchResult.result);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-3.5 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                  }`}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy Result"}</span>
                </button>

                <button
                  onClick={() => onSelectResultToCalc(searchResult.result)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/20 active:scale-95"
                  title="Send result to calculator"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Use Result</span>
                </button>
              </div>
            </div>

            {/* Result Highlight Box */}
            <div
              className={`p-4 rounded-2xl border ${
                theme === "light"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-blue-500/10 border-blue-500/20"
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-wider uppercase block mb-1 ${
                  theme === "light" ? "text-blue-700" : "text-blue-400"
                }`}
              >
                Final Answer
              </span>
              <p
                className={`font-sans text-2xl sm:text-3xl font-semibold tracking-tight ${
                  theme === "light" ? "text-blue-700" : "text-blue-400"
                }`}
              >
                = {searchResult.result}
              </p>
            </div>

            {/* Voice Text-to-Speech Narrator for Math Solution */}
            <AudioSolutionReader solutionData={searchResult} />

            {/* Key Formulas if available */}
            {searchResult.keyFormulas && searchResult.keyFormulas.length > 0 && (
              <div
                className={`p-4 rounded-2xl border space-y-1 ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white/5 border-white/5"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    theme === "light" ? "text-blue-600" : "text-blue-400"
                  }`}
                >
                  Key Formulas Used:
                </span>
                <div
                  className={`flex flex-wrap gap-2 pt-1 font-mono text-xs font-semibold ${
                    theme === "light" ? "text-slate-800" : "text-white"
                  }`}
                >
                  {searchResult.keyFormulas.map((f, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-xl border ${
                        theme === "light"
                          ? "bg-white border-slate-200 shadow-sm"
                          : "bg-white/10 border-white/10"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Collapsible Step-by-Step Derivation Accordion */}
            {searchResult.steps && searchResult.steps.length > 0 && (
              <StepAccordion steps={searchResult.steps} defaultAllExpanded={true} />
            )}

            {/* Summary Explanation */}
            {searchResult.explanation && (
              <p
                className={`text-xs p-3.5 rounded-2xl border leading-relaxed ${
                  theme === "light"
                    ? "text-slate-700 bg-slate-50 border-slate-200"
                    : "text-slate-300 bg-white/5 border-white/5"
                }`}
              >
                <span
                  className={`font-semibold ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}
                >
                  Concept Summary:{" "}
                </span>
                {searchResult.explanation}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
