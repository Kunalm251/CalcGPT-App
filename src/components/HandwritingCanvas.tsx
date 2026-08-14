import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AudioSolutionReader } from "./AudioSolutionReader";
import { StepAccordion } from "./StepAccordion";
import {
  PenTool,
  Eraser,
  RotateCcw,
  Sparkles,
  Download,
  FileDown,
  Check,
  Copy,
  Grid,
  Maximize2,
  Trash2,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { CalculationItem, HandwritingResult, ThemeMode } from "../types";
import { exportElementAsPng, exportCalculationPdf } from "../utils/exportUtils";

interface HandwritingCanvasProps {
  onSaveCalculation: (item: Omit<CalculationItem, "id" | "timestamp">) => void;
  theme?: ThemeMode;
}

type BackgroundGridStyle = "graph" | "ruled" | "blank" | "light-graph";

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  onSaveCalculation,
  theme = "dark",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState(theme === "light" ? "#0284c7" : "#38bdf8");
  const [penSize, setPenSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [gridStyle, setGridStyle] = useState<BackgroundGridStyle>("graph");

  // History stack for undo stroke
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  // AI Recognition state
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<HandwritingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resize canvas according to container dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      // Keep canvas resolution crisp
      const width = rect.width;
      const height = Math.max(380, Math.min(rect.height, 500));

      // Save existing image content before resize if any
      const ctx = canvas.getContext("2d");
      let tempImage: ImageData | null = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
          /* ignore */
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (tempImage) {
          ctx.putImageData(tempImage, 0, 0);
        } else {
          clearCanvasBackground(ctx, width, height, gridStyle);
        }
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [gridStyle, theme]);

  const clearCanvasBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    style: BackgroundGridStyle
  ) => {
    ctx.clearRect(0, 0, width, height);
    const isLight = theme === "light";

    if (style === "blank") {
      ctx.fillStyle = isLight ? "#ffffff" : "#0f172a";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    if (style === "light-graph" || (isLight && style === "graph")) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      return;
    }

    if (isLight && style === "ruled") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      const lineGap = 30;
      for (let y = 40; y < height; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      return;
    }

    // Default Dark Graph Grid
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    if (style === "graph") {
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (style === "ruled") {
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      const lineGap = 30;
      for (let y = 40; y < height; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-10), imgData]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    ctx.putImageData(previousState, 0, 0);
  };

  const handleClearCanvas = () => {
    saveCanvasState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    clearCanvasBackground(ctx, canvas.width, canvas.height, gridStyle);
    setAiResult(null);
    setErrorMsg(null);
  };

  // Canvas Mouse & Touch Drawing Handlers
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    saveCanvasState();
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isEraser) {
      ctx.strokeStyle = gridStyle === "light-graph" ? "#f8fafc" : "#0f172a";
      ctx.lineWidth = penSize * 4;
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.closePath();
  };

  // Recognize & Calculate Handwritten Math via Gemini Server API
  const handleCalculateHandwriting = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMsg(
        "Offline Mode Active: AI handwriting recognition requires network connection. Standard & Scientific Calculator tools, History log, and PDF export are ready to work offline!"
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAiResult(null);

    try {
      const imageBase64 = canvas.toDataURL("image/png");

      const response = await fetch("/api/recognize-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to solve handwritten equation");
      }

      const result: HandwritingResult = data;
      setAiResult(result);

      // Auto save to history if valid equation
      if (result.isMathEquation) {
        onSaveCalculation({
          expression: result.recognizedEquation,
          result: result.result,
          type: "handwritten",
          steps: result.steps,
          explanation: result.explanation,
          imageBase64,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err: any) {
      console.error("Recognition Error:", err);
      setErrorMsg(err?.message || "Could not read equation. Draw clearly and try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImagePNG = () => {
    if (canvasRef.current) {
      exportElementAsPng(canvasRef.current, `handwritten_math_${Date.now()}.png`);
    }
  };

  const handleExportPDF = () => {
    if (aiResult) {
      exportCalculationPdf(
        [
          {
            id: "hw-1",
            expression: aiResult.recognizedEquation,
            result: aiResult.result,
            type: "handwritten",
            timestamp: Date.now(),
            steps: aiResult.steps,
            explanation: aiResult.explanation,
          },
        ],
        "Handwritten Equation Solution",
        canvasRef.current
      );
    } else if (canvasRef.current) {
      exportCalculationPdf([], "Handwritten Canvas Note", canvasRef.current);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Canvas Tool Toolbar - Frosted Glass Card */}
      <div
        className={`border backdrop-blur-2xl rounded-2xl p-2 sm:p-3 shadow-xl flex flex-wrap items-center justify-between gap-2.5 transition-colors duration-200 ${
          theme === "light"
            ? "bg-white/80 border-slate-200 shadow-slate-200/50"
            : "bg-white/5 border-white/10"
        }`}
      >
        {/* Color Palette & Pen / Eraser */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              theme === "light"
                ? "bg-slate-100 border-slate-200"
                : "bg-white/5 border-white/5"
            }`}
          >
            <button
              onClick={() => setIsEraser(false)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                !isEraser
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>

            <button
              onClick={() => setIsEraser(true)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                isEraser
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          {!isEraser && (
            <div
              className={`flex items-center gap-1.5 pl-1 sm:pl-2 border-l ${
                theme === "light" ? "border-slate-200" : "border-white/10"
              }`}
            >
              {(theme === "light"
                ? [
                    { color: "#0284c7", name: "Blue" },
                    { color: "#0f172a", name: "Black" },
                    { color: "#dc2626", name: "Red" },
                    { color: "#059669", name: "Emerald" },
                    { color: "#7c3aed", name: "Purple" },
                  ]
                : [
                    { color: "#38bdf8", name: "Sky Blue" },
                    { color: "#facc15", name: "Yellow" },
                    { color: "#ffffff", name: "White" },
                    { color: "#34d399", name: "Emerald" },
                    { color: "#c084fc", name: "Purple" },
                  ]
              ).map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                    penColor === c.color
                      ? "border-blue-500 scale-110 ring-2 ring-blue-500/40"
                      : theme === "light"
                      ? "border-slate-300 shadow-sm"
                      : "border-white/20"
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Pen Size */}
          <div
            className={`flex items-center gap-1 pl-1 sm:pl-2 border-l ${
              theme === "light" ? "border-slate-200" : "border-white/10"
            }`}
          >
            {[
              { size: 2, label: "Fine" },
              { size: 4, label: "Med" },
              { size: 8, label: "Thick" },
            ].map((s) => (
              <button
                key={s.size}
                onClick={() => setPenSize(s.size)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                  penSize === s.size
                    ? theme === "light"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white/20 text-white border border-white/20"
                    : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid & Clear Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <select
            value={gridStyle}
            onChange={(e) => setGridStyle(e.target.value as BackgroundGridStyle)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none ${
              theme === "light"
                ? "bg-slate-100 border-slate-200 text-slate-800"
                : "bg-white/5 border-white/10 text-slate-200"
            }`}
          >
            <option value="graph" className={theme === "light" ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
              Graph Grid
            </option>
            <option value="ruled" className={theme === "light" ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
              Notebook Lines
            </option>
            <option value="blank" className={theme === "light" ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
              Blank Canvas
            </option>
            <option value="light-graph" className={theme === "light" ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
              Light Grid
            </option>
          </select>

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`p-1.5 sm:p-2 rounded-xl active:scale-95 border disabled:opacity-40 transition-all ${
              theme === "light"
                ? "text-slate-600 hover:bg-slate-100 border-slate-200"
                : "text-slate-300 hover:bg-white/10 border-white/5"
            }`}
            title="Undo Stroke"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearCanvas}
            className={`p-1.5 sm:p-2 rounded-xl active:scale-95 border transition-all ${
              theme === "light"
                ? "text-rose-600 hover:bg-rose-50 border-rose-200"
                : "text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
            }`}
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Drawing Screen Container - Frosted Glass Rounded Canvas Frame */}
      <div
        ref={containerRef}
        className={`relative rounded-[32px] overflow-hidden border shadow-2xl min-h-[380px] touch-none cursor-crosshair group transition-colors duration-200 ${
          theme === "light"
            ? "border-slate-300 bg-white shadow-slate-200/80"
            : "border-white/10 bg-slate-950/90"
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block"
        />

        {/* Floating Instruction overlay */}
        <div
          className={`absolute top-4 left-4 backdrop-blur-xl px-3.5 py-1.5 rounded-2xl border text-xs flex items-center gap-2 pointer-events-none shadow-sm ${
            theme === "light"
              ? "bg-white/85 border-slate-200 text-slate-700"
              : "bg-white/5 border-white/10 text-slate-300"
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Write equation or formula on canvas using pen or mouse</span>
        </div>

        {/* Calculate Action Button Floating */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={handleSaveImagePNG}
            className={`p-2.5 rounded-2xl border shadow-lg text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
              theme === "light"
                ? "bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200"
                : "bg-white/10 hover:bg-white/20 text-slate-200 border-white/10"
            }`}
            title="Download Canvas Image PNG"
          >
            <Download className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden sm:inline">Save Image</span>
          </button>

          <button
            id="calculate-handwriting-btn"
            onClick={handleCalculateHandwriting}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 border border-blue-500 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Equation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Calculate Equation (AI)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Solution Result Card - Frosted Glass Style */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`border backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl space-y-4 transition-colors duration-200 ${
              theme === "light"
                ? "bg-white/90 border-slate-200 shadow-slate-200/60"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 ${
                theme === "light" ? "border-slate-100" : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={`font-bold text-sm ${
                      theme === "light" ? "text-slate-900" : "text-white"
                    }`}
                  >
                    Handwritten AI Math Result
                  </h3>
                  <p
                    className={`text-[11px] ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Recognized & Solved step-by-step
                  </p>
                </div>
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
                  <span>PDF Report</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiResult.result);
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
              </div>
            </div>

            {/* Recognized Equation & Final Answer Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-2xl border ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white/5 border-white/5"
                }`}
              >
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase block mb-1 ${
                    theme === "light" ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Recognized Formula
                </span>
                <p
                  className={`font-mono text-base sm:text-lg font-bold ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}
                >
                  {aiResult.recognizedEquation}
                </p>
              </div>

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
                  Calculated Answer
                </span>
                <p
                  className={`font-sans text-3xl font-semibold tracking-tight ${
                    theme === "light" ? "text-blue-700" : "text-blue-400"
                  }`}
                >
                  = {aiResult.result}
                </p>
              </div>
            </div>

            {/* Voice Text-to-Speech Narrator for Solution */}
            <AudioSolutionReader
              solutionData={{
                title: `Handwritten formula: ${aiResult.recognizedEquation}`,
                expression: aiResult.recognizedEquation,
                result: aiResult.result,
                steps: aiResult.steps,
                explanation: aiResult.explanation,
              }}
            />

            {/* Interactive Step-by-Step Breakdown Accordion */}
            {aiResult.steps && aiResult.steps.length > 0 && (
              <StepAccordion steps={aiResult.steps} defaultAllExpanded={true} />
            )}

            {/* Explanation */}
            {aiResult.explanation && (
              <p
                className={`text-xs p-3 rounded-2xl border leading-relaxed ${
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
                  Explanation:{" "}
                </span>
                {aiResult.explanation}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
