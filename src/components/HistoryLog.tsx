import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AudioSolutionReader } from "./AudioSolutionReader";
import {
  History,
  Search,
  Trash2,
  FileDown,
  Copy,
  Check,
  Star,
  Calculator,
  PenTool,
  Sparkles,
  ArrowRight,
  Filter,
  TrendingUp,
} from "lucide-react";
import { CalculationItem, CalculationType, ThemeMode } from "../types";
import { exportCalculationPdf } from "../utils/exportUtils";

interface HistoryLogProps {
  items: CalculationItem[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSelectResultToCalc: (result: string) => void;
  theme?: ThemeMode;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  items,
  onClearHistory,
  onDeleteItem,
  onToggleFavorite,
  onSelectResultToCalc,
  theme = "dark",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<CalculationType | "all" | "favorite">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    // Type Filter
    if (typeFilter === "favorite" && !item.isFavorite) return false;
    if (typeFilter !== "all" && typeFilter !== "favorite" && item.type !== typeFilter) return false;

    // Search Query Filter
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      item.expression.toLowerCase().includes(query) ||
      item.result.toLowerCase().includes(query) ||
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.explanation && item.explanation.toLowerCase().includes(query))
    );
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: CalculationType) => {
    switch (type) {
      case "handwritten":
        return <PenTool className="w-3.5 h-3.5 text-cyan-500" />;
      case "ai_search":
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case "graphing":
        return <TrendingUp className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Calculator className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const handleExportFilteredPdf = () => {
    exportCalculationPdf(
      filteredItems,
      typeFilter === "all" ? "Calculation History Report" : `${typeFilter.toUpperCase()} Calculations Log`
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Header Controls & Search Bar - Frosted Glass Card */}
      <div
        className={`border backdrop-blur-2xl rounded-[32px] p-5 shadow-2xl space-y-4 transition-colors duration-200 ${
          theme === "light"
            ? "bg-white/90 border-slate-200 shadow-slate-200/60"
            : "bg-white/5 border-white/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`font-bold text-base sm:text-lg leading-tight ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}
              >
                Calculation History Log
              </h2>
              <p
                className={`text-xs ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Total {items.length} records saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFilteredPdf}
              disabled={filteredItems.length === 0}
              className="px-4 py-2 rounded-2xl bg-blue-600 border border-blue-500 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            {items.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all calculation history logs?")) {
                    onClearHistory();
                  }
                }}
                className={`p-2.5 rounded-2xl border transition-colors ${
                  theme === "light"
                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                }`}
                title="Clear All History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div
          className={`flex flex-col sm:flex-row gap-2.5 pt-3 border-t ${
            theme === "light" ? "border-slate-100" : "border-white/10"
          }`}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter calculation history..."
              className={`w-full pl-10 pr-3 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
                theme === "light"
                  ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                  : "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
            {[
              { id: "all", label: "All" },
              { id: "favorite", label: "Favorites" },
              { id: "standard", label: "Calculator" },
              { id: "graphing", label: "2D Grapher" },
              { id: "handwritten", label: "Handwritten" },
              { id: "ai_search", label: "AI Search" },
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setTypeFilter(tag.id as any)}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                  typeFilter === tag.id
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                    : theme === "light"
                    ? "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              key="empty-history"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`border backdrop-blur-2xl rounded-[32px] p-10 text-center space-y-3 transition-colors duration-200 ${
                theme === "light"
                  ? "bg-white/90 border-slate-200 shadow-slate-200/50"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${
                  theme === "light"
                    ? "bg-slate-100 border-slate-200 text-slate-400"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                <History className="w-6 h-6" />
              </div>
              <h3
                className={`font-bold text-sm ${
                  theme === "light" ? "text-slate-800" : "text-slate-200"
                }`}
              >
                No calculation history found
              </h3>
              <p
                className={`text-xs max-w-sm mx-auto ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Calculations performed in standard mode, handwritten write screen, or AI assistant queries will be stored here for future reference.
              </p>
            </motion.div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  y: -10,
                  transition: { duration: 0.18, ease: "easeInOut" },
                }}
                transition={{
                  layout: { duration: 0.22, ease: "easeInOut" },
                  opacity: { duration: 0.2 },
                  y: { type: "spring", stiffness: 350, damping: 28 },
                  scale: { type: "spring", stiffness: 350, damping: 28 },
                }}
                className={`border backdrop-blur-2xl rounded-2xl p-4 shadow-lg transition-all space-y-2 group ${
                  theme === "light"
                    ? "bg-white/90 border-slate-200 shadow-slate-200/50 hover:border-slate-300"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-xl border ${
                        theme === "light"
                          ? "bg-slate-100 border-slate-200"
                          : "bg-white/5 border-white/5"
                      }`}
                    >
                      {getTypeIcon(item.type)}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                        {item.type}
                      </span>
                      <span
                        className={`text-[10px] ml-2 ${
                          theme === "light" ? "text-slate-400" : "text-slate-400"
                        }`}
                      >
                        {new Date(item.timestamp).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Favorite & Delete Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        item.isFavorite
                          ? "text-amber-500 dark:text-amber-300 bg-amber-500/20 border border-amber-500/30"
                          : "text-slate-400 hover:text-amber-500"
                      }`}
                      title="Bookmark Item"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        theme === "light"
                          ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/20"
                      }`}
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expression & Result */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
                  <div
                    className={`font-mono text-sm sm:text-base font-bold break-all ${
                      theme === "light" ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {item.title ? (
                      <div>
                        <span
                          className={`block text-xs font-semibold font-sans ${
                            theme === "light" ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span>{item.expression}</span>
                      </div>
                    ) : (
                      item.expression
                    )}
                  </div>

                  <div
                    className={`font-sans text-xl sm:text-2xl font-semibold tracking-tight whitespace-nowrap ${
                      theme === "light" ? "text-blue-700" : "text-blue-400"
                    }`}
                  >
                    = {item.result}
                  </div>
                </div>

                {/* Steps if available */}
                {item.steps && item.steps.length > 0 && (
                  <div
                    className={`p-3 rounded-2xl border text-xs font-mono space-y-1 mt-2 ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-white/5 border-white/5 text-slate-300"
                    }`}
                  >
                    <p
                      className={`font-bold text-[10px] uppercase ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Solution Steps:
                    </p>
                    {item.steps.slice(0, 3).map((s, idx) => (
                      <p key={idx} className="truncate">
                        • {s}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Toolbar */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t ${
                    theme === "light" ? "border-slate-100" : "border-white/10"
                  }`}
                >
                  <AudioSolutionReader
                    compact={true}
                    solutionData={{
                      title: item.title,
                      expression: item.expression,
                      result: item.result,
                      steps: item.steps,
                      explanation: item.explanation,
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.id, item.result)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        theme === "light"
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-200"
                      }`}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === item.id ? "Copied" : "Copy Result"}</span>
                    </button>

                    <button
                      onClick={() => onSelectResultToCalc(item.result)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 ${
                        theme === "light"
                          ? "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                          : "bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30 text-blue-300"
                      }`}
                      title="Load result into main calculator"
                    >
                      <span>Use in Calculator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
