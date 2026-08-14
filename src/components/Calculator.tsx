import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Delete,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  History,
  Bookmark,
  Share2,
  TrendingUp,
} from "lucide-react";
import { AngleUnit, CalculationItem, CalculatorMode, ThemeMode } from "../types";
import { evaluateMathExpression } from "../utils/mathEngine";
import { CartesianGrapher } from "./CartesianGrapher";

interface CalculatorProps {
  mode: CalculatorMode;
  setMode: (mode: CalculatorMode) => void;
  angleUnit: AngleUnit;
  setAngleUnit: (unit: AngleUnit) => void;
  onSaveCalculation: (item: Omit<CalculationItem, "id" | "timestamp">) => void;
  recentCalculations: CalculationItem[];
  theme?: ThemeMode;
}

export const Calculator: React.FC<CalculatorProps> = ({
  mode,
  setMode,
  angleUnit,
  setAngleUnit,
  onSaveCalculation,
  recentCalculations,
  theme = "dark",
}) => {
  const [expression, setExpression] = useState("");
  const [lastResult, setLastResult] = useState("");
  const [memory, setMemory] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Gesture touch tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Evaluate expression live
  const liveEvaluation = evaluateMathExpression(expression, angleUnit);

  const handleInput = (char: string) => {
    setSavedSuccess(false);
    if (char === "=") {
      handleCalculate();
      return;
    }
    setExpression((prev) => prev + char);
  };

  const handleClear = () => {
    setExpression("");
    setLastResult("");
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!expression.trim()) return;

    const { result, error } = evaluateMathExpression(expression, angleUnit);

    if (error || result === "Error") {
      setLastResult("Error");
      return;
    }

    setLastResult(result);

    // Auto save calculation
    onSaveCalculation({
      expression,
      result,
      type: mode,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyResult = () => {
    const textToCopy = lastResult || liveEvaluation.result || expression;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in search input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key;

      if (/^[0-9.()+\-*/^%]$/.test(key)) {
        e.preventDefault();
        let char = key;
        if (key === "*") char = "×";
        if (key === "/") char = "÷";
        if (key === "-") char = "−";
        handleInput(char);
      } else if (key === "Enter") {
        e.preventDefault();
        handleCalculate();
      } else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expression, angleUnit]);

  // Touch / Gesture swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe left -> Backspace gesture
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 40) {
      if (deltaX < 0) {
        handleBackspace(); // Swipe left to backspace
      }
    }

    // Vertical swipe down -> Toggle quick history gesture
    if (deltaY > 60 && Math.abs(deltaX) < 40) {
      setShowHistoryDrawer(true);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className={`w-full ${mode === "graphing" ? "max-w-4xl" : "max-w-xl"} mx-auto flex flex-col gap-4 sm:gap-5`}>
      {mode === "graphing" ? (
        <CartesianGrapher
          onSaveToHistory={onSaveCalculation}
          onSendToCalculator={(expr) => {
            setExpression(expr);
            setMode("scientific");
          }}
          theme={theme}
        />
      ) : (
        <>
          {/* Main Display Box - Frosted Glass Card */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`relative border backdrop-blur-2xl rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 flex flex-col justify-between select-none min-h-[160px] sm:min-h-[180px] overflow-hidden transition-colors duration-200 ${
              theme === "light"
                ? "bg-white border-slate-200 shadow-xl shadow-slate-200/60"
                : "bg-slate-900/60 border-white/10 shadow-2xl"
            }`}
          >
            {/* Top Status Indicators */}
            <div
              className={`flex items-center justify-between text-xs mb-1.5 font-mono ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                    theme === "light"
                      ? "bg-blue-100 border border-blue-200 text-blue-700"
                      : "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                  }`}
                >
                  {mode}
                </span>
                {mode === "scientific" && (
                  <button
                    onClick={() => setAngleUnit(angleUnit === "deg" ? "rad" : "deg")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                      theme === "light"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                        : "bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
                    }`}
                    title="Toggle Angle Unit (Degree / Radian)"
                  >
                    {angleUnit.toUpperCase()}
                  </button>
                )}
                {memory !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      theme === "light"
                        ? "bg-amber-100 border border-amber-200 text-amber-700"
                        : "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                    }`}
                  >
                    M: {memory}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-medium active:scale-95 transition-all ${
                    theme === "light"
                      ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                  title="Toggle Quick Recent History"
                >
                  <History className="w-3 h-3 text-blue-500" />
                  <span className="hidden sm:inline">Recent</span>
                </button>
                <span
                  className={`text-[10px] hidden sm:inline ${
                    theme === "light" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Swipe left to ⌫
                </span>
              </div>
            </div>

            {/* Expression Input String */}
            <div className="text-right overflow-x-auto whitespace-nowrap scrollbar-none py-1">
              <span
                className={`text-lg sm:text-2xl font-light tracking-wide font-mono ${
                  theme === "light" ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {expression || "0"}
              </span>
            </div>

            {/* Calculated Result Display */}
            <div
              className={`flex items-baseline justify-between mt-2 pt-2 sm:pt-3 border-t ${
                theme === "light" ? "border-slate-100" : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {(lastResult || liveEvaluation.result) && (
                    <motion.button
                      key="copy-btn"
                      initial={{ opacity: 0, scale: 0.9, x: -4 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -4 }}
                      transition={{ duration: 0.15 }}
                      onClick={handleCopyResult}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs transition-all border active:scale-95 ${
                        theme === "light"
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          : "bg-white/10 hover:bg-white/15 text-slate-300 border-white/10"
                      }`}
                      title="Copy Result"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {savedSuccess && (
                    <motion.span
                      key="saved-toast"
                      initial={{ opacity: 0, scale: 0.85, x: -6 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.85, x: -6 }}
                      transition={{ duration: 0.18 }}
                      className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                        theme === "light"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-right overflow-hidden flex-1 pl-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={lastResult ? `last-${lastResult}` : `live-${liveEvaluation.result || "0"}`}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className={`inline-block text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight font-sans max-w-full truncate ${
                      theme === "light" ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {lastResult ? lastResult : liveEvaluation.result ? liveEvaluation.result : "0"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Quick History Drawer Popup overlay */}
          <AnimatePresence>
            {showHistoryDrawer && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className={`border backdrop-blur-2xl rounded-2xl p-4 shadow-xl space-y-2 overflow-hidden transition-colors duration-200 ${
                  theme === "light"
                    ? "bg-white border-slate-200 text-slate-800"
                    : "bg-slate-900/90 border-white/10 text-slate-100"
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b pb-2 ${
                    theme === "light" ? "border-slate-100" : "border-white/10"
                  }`}
                >
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      theme === "light" ? "text-slate-800" : "text-slate-200"
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-blue-500" />
                    Quick Recent Calculations
                  </span>
                  <button
                    onClick={() => setShowHistoryDrawer(false)}
                    className={`text-xs hover:underline ${
                      theme === "light" ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {recentCalculations.length === 0 ? (
                      <motion.p
                        key="no-recent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-xs text-slate-400 dark:text-slate-500 py-3"
                      >
                        No calculation history yet
                      </motion.p>
                    ) : (
                      recentCalculations.slice(0, 5).map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15, delay: idx * 0.03 }}
                          onClick={() => {
                            setExpression(item.result);
                            setShowHistoryDrawer(false);
                          }}
                          className={`pt-1.5 flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl transition-colors ${
                            theme === "light"
                              ? "hover:bg-slate-100 text-slate-700"
                              : "hover:bg-white/5 text-slate-300"
                          }`}
                        >
                          <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {item.expression}
                          </span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            = {item.result}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keypad Layout */}
          <div
            className={`border backdrop-blur-2xl p-3 sm:p-4 rounded-[28px] sm:rounded-[32px] shadow-2xl space-y-2.5 sm:space-y-3 transition-colors duration-200 ${
              theme === "light"
                ? "bg-white/80 border-slate-200 shadow-slate-200/50"
                : "bg-white/5 border-white/10 shadow-2xl"
            }`}
          >
            {/* Scientific Secondary Grid */}
            {mode === "scientific" && (
              <div
                className={`grid grid-cols-5 gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 border-b ${
                  theme === "light" ? "border-slate-200" : "border-white/10"
                }`}
              >
                {[
                  { label: "sin", value: "sin(" },
                  { label: "cos", value: "cos(" },
                  { label: "tan", value: "tan(" },
                  { label: "ln", value: "ln(" },
                  { label: "log", value: "log(" },
                  { label: "√", value: "√(" },
                  { label: "x²", value: "^2" },
                  { label: "xʸ", value: "^" },
                  { label: "(", value: "(" },
                  { label: ")", value: ")" },
                  { label: "π", value: "π" },
                  { label: "e", value: "e" },
                  { label: "x!", value: "!" },
                  { label: "1/x", value: "1/(" },
                  { label: "abs", value: "abs(" },
                ].map((btn, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleInput(btn.value)}
                    className={`py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                      theme === "light"
                        ? "bg-sky-50/80 hover:bg-sky-100 text-sky-800 border-sky-100 shadow-sm"
                        : "bg-white/5 border-white/5 text-blue-300 hover:bg-white/10"
                    }`}
                  >
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Memory Row */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[
                { label: "MC", action: () => setMemory(null) },
                {
                  label: "MR",
                  action: () => memory !== null && setExpression((p) => p + memory),
                },
                {
                  label: "M+",
                  action: () => {
                    const num = liveEvaluation.numericValue;
                    if (num !== null) setMemory((m) => (m || 0) + num);
                  },
                },
                {
                  label: "MS",
                  action: () => {
                    const num = liveEvaluation.numericValue;
                    if (num !== null) setMemory(num);
                  },
                },
              ].map((mBtn, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.93 }}
                  onClick={mBtn.action}
                  className={`py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200/60 shadow-sm"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {mBtn.label}
                </motion.button>
              ))}
            </div>

            {/* Primary Calculator Keypad Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {/* Row 1 */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleClear}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-lg sm:text-xl font-medium active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200/60 shadow-sm"
                    : "bg-white/5 border-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                C
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleBackspace}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-lg sm:text-xl font-medium active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60 shadow-sm"
                    : "bg-white/5 border-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <Delete className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("%")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-lg sm:text-xl font-medium active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60 shadow-sm"
                    : "bg-white/5 border-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                %
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("÷")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-bold active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80 shadow-sm"
                    : "bg-blue-600/20 border-blue-500/20 text-blue-400 hover:bg-blue-600/30"
                }`}
              >
                ÷
              </motion.button>

              {/* Row 2: 7, 8, 9, × */}
              {["7", "8", "9"].map((num) => (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleInput(num)}
                  className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-semibold active:scale-95 transition-all flex items-center justify-center ${
                    theme === "light"
                      ? "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
                      : "bg-white/10 border-white/5 text-white hover:bg-white/15"
                  }`}
                >
                  {num}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("×")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-bold active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80 shadow-sm"
                    : "bg-blue-600/20 border-blue-500/20 text-blue-400 hover:bg-blue-600/30"
                }`}
              >
                ×
              </motion.button>

              {/* Row 3: 4, 5, 6, - */}
              {["4", "5", "6"].map((num) => (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleInput(num)}
                  className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-semibold active:scale-95 transition-all flex items-center justify-center ${
                    theme === "light"
                      ? "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
                      : "bg-white/10 border-white/5 text-white hover:bg-white/15"
                  }`}
                >
                  {num}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("−")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-bold active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80 shadow-sm"
                    : "bg-blue-600/20 border-blue-500/20 text-blue-400 hover:bg-blue-600/30"
                }`}
              >
                -
              </motion.button>

              {/* Row 4: 1, 2, 3, + */}
              {["1", "2", "3"].map((num) => (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleInput(num)}
                  className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-semibold active:scale-95 transition-all flex items-center justify-center ${
                    theme === "light"
                      ? "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
                      : "bg-white/10 border-white/5 text-white hover:bg-white/15"
                  }`}
                >
                  {num}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("+")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-bold active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80 shadow-sm"
                    : "bg-blue-600/20 border-blue-500/20 text-blue-400 hover:bg-blue-600/30"
                }`}
              >
                +
              </motion.button>

              {/* Row 5: ( ), 0, ., = */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("(")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-base sm:text-xl font-medium active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60 shadow-sm"
                    : "bg-white/5 border-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                ( )
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput("0")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-semibold active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
                    : "bg-white/10 border-white/5 text-white hover:bg-white/15"
                }`}
              >
                0
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleInput(".")}
                className={`h-12 sm:h-14 md:h-16 rounded-2xl border text-xl sm:text-2xl font-semibold active:scale-95 transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"
                    : "bg-white/10 border-white/5 text-white hover:bg-white/15"
                }`}
              >
                .
              </motion.button>

              <motion.button
                id="calc-equals-btn"
                whileTap={{ scale: 0.93 }}
                onClick={handleCalculate}
                className="h-12 sm:h-14 md:h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-xl sm:text-2xl font-bold text-white shadow-lg shadow-blue-500/30 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center border border-white/20"
              >
                =
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
