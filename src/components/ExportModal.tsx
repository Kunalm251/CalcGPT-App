import React, { useState } from "react";
import { X, FileDown, Image, Check, FileText } from "lucide-react";
import { CalculationItem, ThemeMode } from "../types";
import { exportCalculationPdf, exportElementAsPng } from "../utils/exportUtils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CalculationItem[];
  theme?: ThemeMode;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  theme = "dark",
}) => {
  const [reportTitle, setReportTitle] = useState("AI Math Calculation Report");
  const [format, setFormat] = useState<"pdf" | "png">("pdf");
  const [scope, setScope] = useState<"all" | "favorites">("all");

  if (!isOpen) return null;

  const handleExport = () => {
    const exportItems =
      scope === "favorites" ? items.filter((i) => i.isFavorite) : items;

    if (format === "pdf") {
      exportCalculationPdf(exportItems, reportTitle);
    } else {
      // Create quick temporary container for PNG export
      const container = document.createElement("div");
      container.style.padding = "24px";
      container.style.backgroundColor = theme === "light" ? "#ffffff" : "#0f172a";
      container.style.color = theme === "light" ? "#0f172a" : "#ffffff";
      container.style.fontFamily = "monospace";
      container.style.width = "600px";

      container.innerHTML = `
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #3b82f6;">${reportTitle}</h2>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 16px;">Exported on ${new Date().toLocaleString()}</p>
        <hr style="border-color: #cbd5e1; margin-bottom: 16px;" />
        ${exportItems
          .map(
            (item, idx) => `
          <div style="background-color: ${theme === "light" ? "#f1f5f9" : "#1e293b"}; border-radius: 12px; padding: 12px; margin-bottom: 10px;">
            <div style="font-size: 10px; color: #6366f1; text-transform: uppercase; font-weight: bold;">#${idx + 1} [${item.type}]</div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">${item.expression}</div>
            <div style="font-size: 16px; font-weight: bold; color: #10b981; margin-top: 4px;">= ${item.result}</div>
          </div>
        `
          )
          .join("")}
      `;

      document.body.appendChild(container);
      exportElementAsPng(container, `${reportTitle.toLowerCase().replace(/\s+/g, "_")}.png`);
      document.body.removeChild(container);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box - Frosted Glass Card */}
      <div
        className={`relative w-full max-w-md backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border space-y-4 z-10 transition-colors duration-200 ${
          theme === "light"
            ? "bg-white/95 border-slate-200 shadow-slate-300/60"
            : "bg-[#020617]/95 border-white/10"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-3 ${
            theme === "light" ? "border-slate-100" : "border-white/10"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <FileDown className="w-5 h-5" />
            </div>
            <h3
              className={`font-bold text-sm ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              Export Calculation Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === "light"
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <label
            className={`text-xs font-semibold ${
              theme === "light" ? "text-slate-700" : "text-slate-300"
            }`}
          >
            Document Report Title:
          </label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                : "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            }`}
          />
        </div>

        {/* Export Format (PDF vs PNG) */}
        <div className="space-y-1.5">
          <label
            className={`text-xs font-semibold ${
              theme === "light" ? "text-slate-700" : "text-slate-300"
            }`}
          >
            Export File Format:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormat("pdf")}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                format === "pdf"
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : theme === "light"
                  ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>PDF Document</span>
            </button>

            <button
              onClick={() => setFormat("png")}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                format === "png"
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : theme === "light"
                  ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <Image className="w-4 h-4" />
              <span>PNG Image</span>
            </button>
          </div>
        </div>

        {/* Scope Selection */}
        <div className="space-y-1.5">
          <label
            className={`text-xs font-semibold ${
              theme === "light" ? "text-slate-700" : "text-slate-300"
            }`}
          >
            Include Calculations:
          </label>
          <div
            className={`flex items-center gap-1.5 p-1 rounded-2xl text-xs font-semibold border ${
              theme === "light"
                ? "bg-slate-100 border-slate-200"
                : "bg-white/5 border-white/5"
            }`}
          >
            <button
              onClick={() => setScope("all")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                scope === "all"
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Logs ({items.length})
            </button>
            <button
              onClick={() => setScope("favorites")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                scope === "favorites"
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                  : theme === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Favorites Only ({items.filter((i) => i.isFavorite).length})
            </button>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center justify-end gap-2 pt-3 border-t ${
            theme === "light" ? "border-slate-100" : "border-white/10"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              theme === "light"
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 border border-blue-500 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
