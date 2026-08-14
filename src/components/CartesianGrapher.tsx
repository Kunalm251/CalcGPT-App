import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Table,
  Sparkles,
  Camera,
  Layers,
  HelpCircle,
  Maximize2,
  Bookmark,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  PlotFunction,
  compileFunction,
  findKeyPoints,
  KeyPoint,
} from "../utils/graphingEngine";
import { ThemeMode } from "../types";

interface CartesianGrapherProps {
  onSaveToHistory?: (item: {
    expression: string;
    result: string;
    type: "graphing" | "scientific" | "standard";
    title?: string;
    steps?: string[];
  }) => void;
  onSendToCalculator?: (expr: string) => void;
  theme?: ThemeMode;
}

const PRESET_EQUATIONS = [
  { label: "Parabola", expr: "x^2 - 4" },
  { label: "Sine Wave", expr: "sin(x)" },
  { label: "Cosine Wave", expr: "2*cos(x)" },
  { label: "Linear", expr: "2*x + 1" },
  { label: "Cubic", expr: "x^3 - 3*x" },
  { label: "Hyperbola", expr: "1/x" },
  { label: "Exponential", expr: "e^x" },
  { label: "Square Root", expr: "sqrt(x)" },
  { label: "Absolute", expr: "abs(x) - 2" },
  { label: "Gaussian", expr: "e^(-(x^2))" },
];

const FUNCTION_COLORS = [
  "#0284c7", // Sky blue / Cyan
  "#9333ea", // Purple / Violet
  "#e11d48", // Rose / Red
  "#059669", // Emerald / Green
  "#d97706", // Amber / Yellow
];

export const CartesianGrapher: React.FC<CartesianGrapherProps> = ({
  onSaveToHistory,
  onSendToCalculator,
  theme = "dark",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Functions list state
  const [functions, setFunctions] = useState<PlotFunction[]>([
    {
      id: "fn-1",
      expression: "x^2 - 4",
      color: FUNCTION_COLORS[0],
      label: "f(x)",
      visible: true,
    },
  ]);
  const [activeFuncId, setActiveFuncId] = useState<string>("fn-1");

  // Coordinate Plane State
  const [center, setCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(35); // Pixels per Cartesian unit

  // Interactive View Controls
  const [showGrid, setShowGrid] = useState(true);
  const [showKeyPoints, setShowKeyPoints] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [hoverCoord, setHoverCoord] = useState<{
    mathX: number;
    mathY: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Drag state for panning canvas
  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const centerStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Notification & Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas Dimensions from ResizeObserver
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 400 });

  // Track container size using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const height = Math.max(340, Math.min(500, width * 0.65));
        setCanvasDimensions({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute key points for visible functions
  const keyPointsMap = React.useMemo(() => {
    const map = new Map<string, KeyPoint[]>();
    const halfWidthUnits = canvasDimensions.width / (2 * scale);
    const xMin = center.x - halfWidthUnits;
    const xMax = center.x + halfWidthUnits;

    functions.forEach((fn) => {
      if (fn.visible) {
        const compiled = compileFunction(fn.expression);
        const points = findKeyPoints(compiled, xMin, xMax);
        map.set(fn.id, points);
      }
    });
    return map;
  }, [functions, center.x, canvasDimensions.width, scale]);

  // Main Canvas Drawing Routine
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    const dpr = window.devicePixelRatio || 1;

    // Adjust canvas resolution for Retina screens
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Screen origin in canvas pixel coordinates
    const originX = width / 2 - center.x * scale;
    const originY = height / 2 + center.y * scale;

    // Coordinate conversion utilities
    const toScreenX = (mathX: number) => originX + mathX * scale;
    const toScreenY = (mathY: number) => originY - mathY * scale;

    const mathXMin = -originX / scale;
    const mathXMax = (width - originX) / scale;
    const mathYMin = -(height - originY) / scale;
    const mathYMax = originY / scale;

    // 1. Clear background
    const isLight = theme === "light";
    ctx.fillStyle = isLight ? "#ffffff" : "#020617";
    ctx.fillRect(0, 0, width, height);

    // Subtle background gradient
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      10,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    if (isLight) {
      bgGrad.addColorStop(0, "rgba(241, 245, 249, 0.7)");
      bgGrad.addColorStop(1, "rgba(255, 255, 255, 1)");
    } else {
      bgGrad.addColorStop(0, "rgba(30, 41, 59, 0.4)");
      bgGrad.addColorStop(1, "rgba(2, 6, 23, 0.95)");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Determine Grid Step based on scale
    let gridStep = 1;
    if (scale < 15) gridStep = 5;
    else if (scale < 30) gridStep = 2;
    else if (scale > 100) gridStep = 0.5;
    else if (scale > 200) gridStep = 0.2;

    // 3. Draw Grid Lines
    if (showGrid) {
      // Minor Grid Lines
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = isLight
        ? "rgba(100, 116, 139, 0.14)"
        : "rgba(255, 255, 255, 0.05)";
      const minorStep = gridStep / 2;

      const minorXStart = Math.floor(mathXMin / minorStep) * minorStep;
      for (let x = minorXStart; x <= mathXMax; x += minorStep) {
        const sx = toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }

      const minorYStart = Math.floor(mathYMin / minorStep) * minorStep;
      for (let y = minorYStart; y <= mathYMax; y += minorStep) {
        const sy = toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();
      }

      // Major Grid Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = isLight
        ? "rgba(100, 116, 139, 0.28)"
        : "rgba(255, 255, 255, 0.12)";
      ctx.fillStyle = isLight
        ? "rgba(71, 85, 105, 0.85)"
        : "rgba(148, 163, 184, 0.7)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const majorXStart = Math.floor(mathXMin / gridStep) * gridStep;
      for (let x = majorXStart; x <= mathXMax; x += gridStep) {
        const sx = toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();

        // X-Axis Numeric Tick Label
        if (Math.abs(x) > 1e-6) {
          const labelY = Math.min(Math.max(originY + 6, 12), height - 20);
          ctx.fillText(Number(x.toFixed(2)).toString(), sx, labelY);
        }
      }

      const majorYStart = Math.floor(mathYMin / gridStep) * gridStep;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let y = majorYStart; y <= mathYMax; y += gridStep) {
        const sy = toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        // Y-Axis Numeric Tick Label
        if (Math.abs(y) > 1e-6) {
          const labelX = Math.min(Math.max(originX - 6, 28), width - 6);
          ctx.fillText(Number(y.toFixed(2)).toString(), labelX, sy);
        }
      }
    }

    // 4. Draw X and Y Axes with Arrows
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = isLight
      ? "rgba(51, 65, 85, 0.9)"
      : "rgba(148, 163, 184, 0.85)";

    // X-Axis (Horizontal)
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // X Arrow
    ctx.beginPath();
    ctx.moveTo(width - 8, originY - 4);
    ctx.lineTo(width, originY);
    ctx.lineTo(width - 8, originY + 4);
    ctx.stroke();

    // Y-Axis (Vertical)
    ctx.beginPath();
    ctx.moveTo(originX, height);
    ctx.lineTo(originX, 0);
    ctx.stroke();

    // Y Arrow
    ctx.beginPath();
    ctx.moveTo(originX - 4, 8);
    ctx.lineTo(originX, 0);
    ctx.lineTo(originX + 4, 8);
    ctx.stroke();

    // Origin (0,0) Label
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    if (originX >= 15 && originX <= width - 15 && originY >= 15 && originY <= height - 15) {
      ctx.fillText("0", originX - 5, originY + 5);
      ctx.fillText("x", width - 8, originY + 8);
      ctx.fillText("y", originX + 14, 4);
    }

    // 5. Plot Mathematical Functions
    functions.forEach((fnItem) => {
      if (!fnItem.visible || !fnItem.expression.trim()) return;

      const evalFn = compileFunction(fnItem.expression);
      ctx.strokeStyle = fnItem.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let isDrawing = false;
      let prevScreenY: number | null = null;
      const pixelStep = 1.5; // Smooth sub-pixel stepping

      for (let px = 0; px <= width; px += pixelStep) {
        const mathX = (px - originX) / scale;
        const mathY = evalFn(mathX);

        if (isNaN(mathY) || !isFinite(mathY)) {
          isDrawing = false;
          prevScreenY = null;
          continue;
        }

        const screenY = toScreenY(mathY);

        // Detect vertical asymptote jump to prevent glitch lines
        if (
          prevScreenY !== null &&
          Math.abs(screenY - prevScreenY) > height * 0.8
        ) {
          isDrawing = false;
        }

        if (!isDrawing) {
          ctx.moveTo(px, screenY);
          isDrawing = true;
        } else {
          ctx.lineTo(px, screenY);
        }

        prevScreenY = screenY;
      }

      ctx.stroke();

      // Glowing stroke effect for primary function
      ctx.save();
      ctx.shadowColor = fnItem.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = fnItem.color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    });

    // 6. Draw Key Points (Roots, Y-Intercepts, Extrema)
    if (showKeyPoints) {
      keyPointsMap.forEach((points, _fnId) => {
        points.forEach((pt) => {
          const sx = toScreenX(pt.x);
          const sy = toScreenY(pt.y);

          if (sx < 0 || sx > width || sy < 0 || sy > height) return;

          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);

          if (pt.type === "root") {
            ctx.fillStyle = "#34d399"; // Emerald for Root
          } else if (pt.type === "y-intercept") {
            ctx.fillStyle = "#38bdf8"; // Cyan for Y-Intercept
          } else {
            ctx.fillStyle = "#fbbf24"; // Amber for Extrema
          }
          ctx.fill();

          ctx.strokeStyle = "#020617";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Small point label
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.font = "9px ui-monospace, monospace";
          ctx.textAlign = "left";
          ctx.fillText(`(${pt.x}, ${pt.y})`, sx + 6, sy - 4);
        });
      });
    }

    // 7. Draw Interactive Cursor Crosshair & Trace
    if (hoverCoord) {
      const { screenX, screenY, mathX, mathY } = hoverCoord;

      // Crosshair projection lines
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;

      // Vertical line to X-axis
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();

      // Horizontal line to Y-axis
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
      ctx.restore();

      // Crosshair glowing dot
      ctx.beginPath();
      ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [
    canvasDimensions,
    center,
    scale,
    functions,
    showGrid,
    showKeyPoints,
    hoverCoord,
    keyPointsMap,
  ]);

  // Redraw when state updates
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Canvas Mouse & Touch Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    centerStart.current = { ...center };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isDragging.current) {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      setCenter({
        x: centerStart.current.x - dx,
        y: centerStart.current.y + dy,
      });
      setHoverCoord(null);
    } else {
      // Trace active function on hover
      const originX = canvasDimensions.width / 2 - center.x * scale;
      const originY = canvasDimensions.height / 2 + center.y * scale;
      const mathX = (clientX - originX) / scale;

      const activeFn = functions.find((f) => f.id === activeFuncId) || functions[0];
      if (activeFn && activeFn.visible) {
        const evalFn = compileFunction(activeFn.expression);
        const mathY = evalFn(mathX);

        if (!isNaN(mathY) && isFinite(mathY)) {
          const screenY = originY - mathY * scale;
          setHoverCoord({
            mathX: Number(mathX.toFixed(3)),
            mathY: Number(mathY.toFixed(3)),
            screenX: clientX,
            screenY,
          });
          return;
        }
      }
      setHoverCoord(null);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setHoverCoord(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.max(10, Math.min(300, prev * zoomFactor)));
  };

  // Touch handlers for mobile pan & pinch
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(35);

  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      centerStart.current = { ...center };
      initialPinchDist.current = null;
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      initialPinchDist.current = getTouchDistance(e.touches[0], e.touches[1]);
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = (e.touches[0].clientX - dragStart.current.x) / scale;
      const dy = (e.touches[0].clientY - dragStart.current.y) / scale;
      setCenter({
        x: centerStart.current.x - dx,
        y: centerStart.current.y + dy,
      });
    } else if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = currentDist / initialPinchDist.current;
      const newScale = Math.max(10, Math.min(300, initialScale.current * ratio));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    initialPinchDist.current = null;
  };

  // Zoom and Pan Controls
  const handleZoomIn = () => setScale((prev) => Math.min(300, prev * 1.25));
  const handleZoomOut = () => setScale((prev) => Math.max(10, prev * 0.8));
  const handleResetCenter = () => {
    setCenter({ x: 0, y: 0 });
    setScale(35);
  };

  // Function manipulation
  const handleAddFunction = () => {
    if (functions.length >= 4) return;
    const newId = "fn-" + (functions.length + 1);
    const color = FUNCTION_COLORS[functions.length % FUNCTION_COLORS.length];
    const newFunc: PlotFunction = {
      id: newId,
      expression: "2*x",
      color,
      label: `f${functions.length + 1}(x)`,
      visible: true,
    };
    setFunctions((prev) => [...prev, newFunc]);
    setActiveFuncId(newId);
  };

  const handleUpdateExpression = (id: string, newExpr: string) => {
    setFunctions((prev) =>
      prev.map((fn) => (fn.id === id ? { ...fn, expression: newExpr } : fn))
    );
  };

  const handleToggleVisibility = (id: string) => {
    setFunctions((prev) =>
      prev.map((fn) => (fn.id === id ? { ...fn, visible: !fn.visible } : fn))
    );
  };

  const handleRemoveFunction = (id: string) => {
    if (functions.length <= 1) return;
    setFunctions((prev) => prev.filter((fn) => fn.id !== id));
    if (activeFuncId === id) {
      setActiveFuncId(functions[0].id);
    }
  };

  // Snapshot / Download Image
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `cartesian-plot-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Save to App Calculation History
  const handleSavePlot = () => {
    const primary = functions.find((f) => f.id === activeFuncId) || functions[0];
    if (!primary) return;

    const points = keyPointsMap.get(primary.id) || [];
    const pointsSummary = points.map((p) => `${p.type}: (${p.x}, ${p.y})`);

    if (onSaveToHistory) {
      onSaveToHistory({
        expression: `y = ${primary.expression}`,
        result: `Plotted on Cartesian Plane (${points.length} key points)`,
        type: "graphing",
        title: `2D Graph of y = ${primary.expression}`,
        steps: pointsSummary,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Function Inputs & Presets Panel */}
      <div
        className={`border backdrop-blur-2xl p-4 sm:p-5 rounded-[28px] shadow-2xl space-y-3.5 transition-colors duration-200 ${
          theme === "light"
            ? "bg-white/80 border-slate-200 shadow-slate-200/50"
            : "bg-white/5 border-white/10"
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
            theme === "light" ? "border-slate-100" : "border-white/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-xl border ${
                theme === "light"
                  ? "bg-sky-100 border-sky-200 text-sky-700"
                  : "bg-sky-500/20 border-sky-500/30 text-sky-400"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3
                className={`text-sm font-bold flex items-center gap-2 ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}
              >
                Cartesian Grapher
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                    theme === "light"
                      ? "bg-sky-50 border-sky-200 text-sky-700"
                      : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  }`}
                >
                  2D Plot
                </span>
              </h3>
              <p
                className={`text-xs ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Input equations to plot curves, trace values, and locate roots & extrema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSavePlot}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                theme === "light"
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
              }`}
              title="Save current plot and roots to calculation history"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Save Plot</span>
                </>
              )}
            </button>

            {functions.length < 4 && (
              <button
                onClick={handleAddFunction}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                  theme === "light"
                    ? "bg-sky-100 hover:bg-sky-200 border-sky-200 text-sky-800"
                    : "bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/30 text-sky-300"
                }`}
                title="Add second curve"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add f(x)</span>
              </button>
            )}
          </div>
        </div>

        {/* Function Input Rows */}
        <div className="space-y-2.5">
          {functions.map((fn, idx) => (
            <div
              key={fn.id}
              onClick={() => setActiveFuncId(fn.id)}
              className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                activeFuncId === fn.id
                  ? theme === "light"
                    ? "bg-sky-50/80 border-sky-400 shadow-sm"
                    : "bg-white/10 border-sky-500/40 shadow-md"
                  : theme === "light"
                  ? "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              {/* Color swatch */}
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: fn.color }}
              />

              {/* Function Label */}
              <span
                className={`text-xs font-mono font-bold whitespace-nowrap ${
                  theme === "light" ? "text-slate-700" : "text-slate-300"
                }`}
              >
                y =
              </span>

              {/* Expression Text Input */}
              <input
                type="text"
                value={fn.expression}
                onChange={(e) => handleUpdateExpression(fn.id, e.target.value)}
                placeholder="e.g. x^2 - 4, sin(x), 2x + 1"
                className={`flex-1 bg-transparent border-0 font-mono text-sm sm:text-base font-semibold focus:outline-none ${
                  theme === "light"
                    ? "text-slate-900 placeholder-slate-400"
                    : "text-white placeholder-slate-500"
                }`}
              />

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onSendToCalculator && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendToCalculator(fn.expression);
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      theme === "light"
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        : "bg-white/5 hover:bg-white/15 text-slate-300"
                    }`}
                    title="Load expression into Main Calculator"
                  >
                    To Calc
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(fn.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === "light"
                      ? "text-slate-500 hover:text-slate-900"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={fn.visible ? "Hide Curve" : "Show Curve"}
                >
                  {fn.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {functions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFunction(fn.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Function"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preset Equation Pills for Fast Exploration */}
        <div className="space-y-1.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              theme === "light" ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Quick Equation Presets:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_EQUATIONS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleUpdateExpression(activeFuncId, preset.expr)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-medium transition-all whitespace-nowrap active:scale-95 ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-sky-50 border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 shadow-sm"
                    : "bg-white/5 hover:bg-sky-500/20 border-white/10 hover:border-sky-500/30 text-slate-300 hover:text-sky-300"
                }`}
              >
                {preset.label}:{" "}
                <span
                  className={`font-bold ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}
                >
                  {preset.expr}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Cartesian Canvas Stage */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-[32px] overflow-hidden border shadow-2xl transition-colors duration-200 ${
          theme === "light"
            ? "border-slate-300/80 bg-white shadow-slate-200/80"
            : "border-white/10 bg-[#020617]"
        }`}
      >
        {/* Floating Canvas Top Overlay: Coordinate Info & Tool Controls */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          {/* Live Coordinate Cursor Badge */}
          <div
            className={`pointer-events-auto backdrop-blur-md border px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-2 ${
              theme === "light"
                ? "bg-white/90 border-slate-200 text-slate-900"
                : "bg-slate-900/80 border-white/10 text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span
              className={`font-mono text-xs font-bold ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              {hoverCoord
                ? `x: ${hoverCoord.mathX}, y: ${hoverCoord.mathY}`
                : `Center: (${Number(center.x.toFixed(1))}, ${Number(center.y.toFixed(1))})`}
            </span>
          </div>

          {/* Quick Graph View Actions */}
          <div
            className={`pointer-events-auto flex items-center gap-1 backdrop-blur-md border p-1 rounded-2xl shadow-lg ${
              theme === "light"
                ? "bg-white/90 border-slate-200"
                : "bg-slate-900/80 border-white/10"
            }`}
          >
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                showGrid
                  ? theme === "light"
                    ? "bg-sky-100 text-sky-800 border border-sky-200"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Toggle Grid Lines"
            >
              Grid
            </button>

            <button
              onClick={() => setShowKeyPoints(!showKeyPoints)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                showKeyPoints
                  ? theme === "light"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Toggle Roots & Extrema markers"
            >
              Key Points
            </button>

            <button
              onClick={() => setShowTable(!showTable)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                showTable
                  ? theme === "light"
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Toggle Value Table"
            >
              <Table className="w-3.5 h-3.5 inline mr-1" />
              Table
            </button>

            <button
              onClick={handleExportPNG}
              className={`p-1.5 rounded-xl transition-colors ${
                theme === "light"
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              title="Download Graph Image (PNG)"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HTML5 Canvas Element */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full cursor-crosshair block touch-none"
          style={{ height: `${canvasDimensions.height}px` }}
        />

        {/* Bottom Floating Canvas Navigation Controls */}
        <div
          className={`absolute bottom-3 right-3 z-10 flex items-center gap-1.5 backdrop-blur-md border p-1.5 rounded-2xl shadow-lg ${
            theme === "light"
              ? "bg-white/90 border-slate-200 text-slate-700"
              : "bg-slate-900/80 border-white/10 text-slate-300"
          }`}
        >
          <button
            onClick={handleZoomIn}
            className={`p-1.5 rounded-xl transition-colors ${
              theme === "light"
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
            }`}
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className={`p-1.5 rounded-xl transition-colors ${
              theme === "light"
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
            }`}
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCenter}
            className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition-colors ${
              theme === "light"
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
            }`}
            title="Reset View to (0,0)"
          >
            (0,0)
          </button>
        </div>

        {/* Gesture Hint Badge */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden sm:block">
          <span
            className={`text-[10px] backdrop-blur-md px-2.5 py-1 rounded-xl border ${
              theme === "light"
                ? "bg-white/90 text-slate-600 border-slate-200"
                : "text-slate-400 bg-slate-900/80 border-white/5"
            }`}
          >
            Drag to pan • Scroll to zoom • Hover to trace
          </span>
        </div>
      </div>

      {/* Discrete Table of Values Drawer */}
      <AnimatePresence>
        {showTable && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`border backdrop-blur-2xl rounded-2xl p-4 shadow-xl space-y-3 overflow-hidden transition-colors duration-200 ${
              theme === "light"
                ? "bg-white border-slate-200"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-2 ${
                theme === "light" ? "border-slate-100" : "border-white/10"
              }`}
            >
              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}
              >
                <Table className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                Table of Values for: y ={" "}
                {functions.find((f) => f.id === activeFuncId)?.expression || "f(x)"}
              </span>
              <span
                className={`text-[10px] ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Step: 1.0
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 text-center font-mono text-xs">
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((xVal) => {
                const activeFn =
                  functions.find((f) => f.id === activeFuncId) || functions[0];
                const evalFn = compileFunction(activeFn?.expression || "");
                const yVal = evalFn(xVal);
                return (
                  <div
                    key={xVal}
                    className={`p-2 rounded-xl border ${
                      xVal === 0
                        ? theme === "light"
                          ? "bg-sky-100 border-sky-300 text-sky-800 font-bold"
                          : "bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold"
                        : theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-white/5 border-white/5 text-slate-300"
                    }`}
                  >
                    <div
                      className={`text-[10px] border-b pb-0.5 ${
                        theme === "light" ? "text-slate-500 border-slate-200" : "text-slate-400 border-white/5"
                      }`}
                    >
                      x={xVal}
                    </div>
                    <div className="pt-1 font-semibold truncate">
                      {isNaN(yVal) || !isFinite(yVal) ? "undef" : Number(yVal.toFixed(2))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
