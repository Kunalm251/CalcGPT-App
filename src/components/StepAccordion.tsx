import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Check,
  Code,
  Sparkles,
  Layers,
} from "lucide-react";

export interface ParsedStep {
  index: number;
  rawText: string;
  title: string;
  body: string;
  mathFormulas: string[];
  category?: string;
}

interface StepAccordionProps {
  steps: string[];
  defaultAllExpanded?: boolean;
}

/**
 * Intelligent parser that extracts step headers, clean explanations,
 * and mathematical equations from raw step strings.
 */
function parseStepString(stepText: string, index: number): ParsedStep {
  let text = stepText.trim();

  // Strip leading prefixes like "Step 1:", "1.", "Step 1 -", etc.
  const prefixMatch = text.match(/^(?:Step\s*\d+[\s:.-]*|\d+[\s:.-]+)\s*/i);
  if (prefixMatch) {
    text = text.substring(prefixMatch[0].length).trim();
  }

  let title = `Step ${index + 1}`;
  let body = text;
  const mathFormulas: string[] = [];

  // Check if there is a colon dividing the summary headline from the formula/detail
  const colonIndex = text.indexOf(":");
  if (colonIndex > 0 && colonIndex < 80) {
    const potentialTitle = text.substring(0, colonIndex).trim();
    const rest = text.substring(colonIndex + 1).trim();
    if (potentialTitle.length > 2) {
      title = potentialTitle;
      body = rest;
    }
  } else if (text.includes(" - ") && text.indexOf(" - ") < 60) {
    const dashIndex = text.indexOf(" - ");
    const potentialTitle = text.substring(0, dashIndex).trim();
    const rest = text.substring(dashIndex + 3).trim();
    if (potentialTitle.length > 2) {
      title = potentialTitle;
      body = rest;
    }
  } else {
    // If no colon or dash, construct a short title if the sentence is long
    const firstSentence = text.split(/[.\n]/)[0];
    if (firstSentence && firstSentence.length < 60 && firstSentence !== text) {
      title = firstSentence;
      body = text.substring(firstSentence.length + 1).trim() || text;
    }
  }

  // Detect and extract math equations / formulas (lines or fragments containing =, \int, d/dx, ^, ±, √, etc.)
  const lines = (body || text).split(/\n+/);
  const cleanBodyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.includes(" = ") ||
      trimmed.includes("=>") ||
      trimmed.includes("->") ||
      trimmed.includes("d/dx") ||
      trimmed.includes("∫") ||
      trimmed.includes("√") ||
      trimmed.includes("±") ||
      trimmed.startsWith("f(") ||
      trimmed.startsWith("f'(") ||
      trimmed.startsWith("y =") ||
      trimmed.startsWith("x =")
    ) {
      mathFormulas.push(trimmed);
    } else {
      cleanBodyLines.push(trimmed);
    }
  }

  // If all lines were extracted as formulas, keep body as original text
  const finalBody = cleanBodyLines.join(" ").trim() || body;

  // Category detection for quick visual badge
  let category: string | undefined;
  const lower = (title + " " + text).toLowerCase();
  if (lower.includes("substitut") || lower.includes("let ")) category = "Substitution";
  else if (lower.includes("derivat") || lower.includes("d/dx") || lower.includes("product rule") || lower.includes("chain rule")) category = "Differentiation";
  else if (lower.includes("integr") || lower.includes("antiderivative")) category = "Integration";
  else if (lower.includes("factor") || lower.includes("simplify") || lower.includes("expand")) category = "Simplification";
  else if (lower.includes("identif") || lower.includes("given") || lower.includes("formula")) category = "Setup";
  else if (lower.includes("final") || lower.includes("result") || lower.includes("solution") || lower.includes("evaluate")) category = "Evaluation";

  return {
    index,
    rawText: stepText,
    title,
    body: finalBody,
    mathFormulas: Array.from(new Set(mathFormulas)),
    category,
  };
}

export const StepAccordion: React.FC<StepAccordionProps> = ({
  steps,
  defaultAllExpanded = true,
}) => {
  const parsedSteps = useMemo(
    () => steps.map((s, idx) => parseStepString(s, idx)),
    [steps]
  );

  // Expanded step indices map
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    parsedSteps.forEach((_, idx) => {
      // By default expand all (or first few if very long)
      initial[idx] = defaultAllExpanded ? true : idx === 0;
    });
    return initial;
  });

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const totalSteps = parsedSteps.length;
  const expandedCount = Object.values(expandedMap).filter(Boolean).length;
  const allExpanded = expandedCount === totalSteps;

  const toggleStep = (index: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<number, boolean> = {};
    parsedSteps.forEach((_, idx) => {
      updated[idx] = nextState;
    });
    setExpandedMap(updated);
  };

  const handleCopyStep = (e: React.MouseEvent, index: number, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {/* Header Bar with Step Counter & Global Toggle */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>Step-by-Step Derivation</span>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 lowercase tracking-normal">
                {totalSteps} {totalSteps === 1 ? "step" : "steps"}
              </span>
            </h4>
          </div>
        </div>

        {/* Global Expand / Collapse Control */}
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl border border-white/10 transition-all"
          title={allExpanded ? "Collapse all steps" : "Expand all steps"}
        >
          <ChevronsUpDown className="w-3.5 h-3.5 text-blue-400" />
          <span>{allExpanded ? "Collapse All" : "Expand All"}</span>
          <span className="text-slate-500 text-[10px]">
            ({expandedCount}/{totalSteps})
          </span>
        </button>
      </div>

      {/* Accordion Container with Sequential Progress Line */}
      <div className="relative pl-3 space-y-2.5 before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-blue-500/40 before:via-sky-500/30 before:to-transparent">
        {parsedSteps.map((step) => {
          const isExpanded = !!expandedMap[step.index];
          const isCopied = copiedIndex === step.index;

          return (
            <motion.div
              key={step.index}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: step.index * 0.03 }}
              className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "bg-white/[0.07] border-blue-500/30 shadow-lg shadow-blue-500/5"
                  : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              {/* Accordion Header Button */}
              <button
                type="button"
                onClick={() => toggleStep(step.index)}
                aria-expanded={isExpanded}
                className="w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 select-none transition-colors"
              >
                {/* Step badge and Step Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Step Number Circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                      isExpanded
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/40 scale-105"
                        : "bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    {step.index + 1}
                  </span>

                  {/* Title & Tag */}
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate max-w-[240px] sm:max-w-[420px]">
                      {step.title}
                    </span>

                    {step.category && (
                      <span className="text-[10px] font-medium px-2 py-0.2 rounded-md bg-blue-500/10 text-blue-300 border border-blue-400/20 whitespace-nowrap">
                        {step.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right controls: Copy Step & Chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopyStep(e, step.index, step.rawText)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
                    title="Copy this step to clipboard"
                    aria-label={`Copy step ${step.index + 1}`}
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="p-1 rounded-lg text-slate-400">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>
              </button>

              {/* Accordion Body Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="p-3.5 pt-3 space-y-2.5 text-xs text-slate-200">
                      {/* Explanatory Body */}
                      {step.body && (
                        <p className="leading-relaxed text-slate-300 font-sans">
                          {step.body}
                        </p>
                      )}

                      {/* Extracted Math Formula Box */}
                      {step.mathFormulas.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {step.mathFormulas.map((formula, fIdx) => (
                            <div
                              key={fIdx}
                              className="bg-black/30 border border-blue-500/20 rounded-xl p-2.5 px-3 font-mono text-xs text-sky-200 flex items-center justify-between gap-2 overflow-x-auto shadow-inner"
                            >
                              <div className="flex items-center gap-2">
                                <Code className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="tracking-wide select-all font-semibold">
                                  {formula}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
