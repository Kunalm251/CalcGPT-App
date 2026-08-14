import React, { useState, useEffect } from "react";
import { Calculator as CalculatorView } from "./components/Calculator";
import { HandwritingCanvas } from "./components/HandwritingCanvas";
import { HistoryLog } from "./components/HistoryLog";
import { AiSearchModal } from "./components/AiSearchModal";
import { ExportModal } from "./components/ExportModal";
import { FooterNav } from "./components/FooterNav";
import {
  ActiveTab,
  AngleUnit,
  CalculationItem,
  CalculatorMode,
  ThemeMode,
} from "./types";

const LOCAL_STORAGE_HISTORY_KEY = "ai_math_calculator_history";
const LOCAL_STORAGE_THEME_KEY = "ai_math_calculator_theme";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calculator");
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>("standard");
  const [angleUnit, setAngleUnit] = useState<AngleUnit>("deg");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    return (saved as ThemeMode) || "dark";
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Persistent History
  const [historyItems, setHistoryItems] = useState<CalculationItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync theme class to document HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_HISTORY_KEY,
        JSON.stringify(historyItems)
      );
    } catch (err) {
      console.warn("Failed to persist history to localStorage", err);
    }
  }, [historyItems]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSaveCalculation = (
    itemData: Omit<CalculationItem, "id" | "timestamp">
  ) => {
    const newItem: CalculationItem = {
      ...itemData,
      id: "calc_" + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    setHistoryItems((prev) => [newItem, ...prev.slice(0, 99)]); // Limit to 100 recent items
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
  };

  const handleSelectResultToCalc = (result: string) => {
    setActiveTab("calculator");
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col justify-between relative overflow-x-hidden transition-colors duration-200 ${
        theme === "dark"
          ? "bg-[#020617] text-slate-100"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Ambient glowing background blur orbs */}
      {theme === "dark" ? (
        <>
          <div className="fixed -top-20 -left-20 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed -bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="fixed top-[35%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="fixed -top-20 -left-20 w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed -bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-300/25 rounded-full blur-[140px] pointer-events-none" />
          <div className="fixed top-[35%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-300/20 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        <div>
          {/* Top App Name Header with Quick Theme Control */}
          <header className="w-full pt-4 pb-2 px-3 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">
            <button
              type="button"
              id="top-app-brand"
              onClick={() => {
                setActiveTab("calculator");
                setCalculatorMode("standard");
              }}
              className="flex items-center gap-2.5 group cursor-pointer select-none text-left active:scale-95 transition-all"
              title="CalcGPT - Standard Calculator"
              aria-label="CalcGPT Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white font-black text-sm group-hover:scale-105 transition-transform">
                C
              </div>
              <div>
                <h1
                  className={`font-extrabold text-lg sm:text-xl tracking-tight leading-none flex items-center ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  <span>Calc</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 font-black ml-0.5">
                    GPT
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1.5 inline-block animate-pulse" />
                </h1>
                <p
                  className={`text-[11px] font-medium leading-tight mt-0.5 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Math, Graphing & AI Solver
                </p>
              </div>
            </button>
          </header>

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-20 sm:pb-24">
            {activeTab === "calculator" && (
              <CalculatorView
                mode={calculatorMode}
                setMode={setCalculatorMode}
                angleUnit={angleUnit}
                setAngleUnit={setAngleUnit}
                onSaveCalculation={handleSaveCalculation}
                recentCalculations={historyItems}
                theme={theme}
              />
            )}

            {activeTab === "handwriting" && (
              <HandwritingCanvas
                onSaveCalculation={handleSaveCalculation}
                theme={theme}
              />
            )}

            {activeTab === "history" && (
              <HistoryLog
                items={historyItems}
                onClearHistory={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
                onToggleFavorite={handleToggleFavorite}
                onSelectResultToCalc={handleSelectResultToCalc}
                theme={theme}
              />
            )}

            {activeTab === "ai_search" && (
              <AiSearchModal
                initialQuery={searchQuery}
                onSaveCalculation={handleSaveCalculation}
                onSelectResultToCalc={handleSelectResultToCalc}
                theme={theme}
              />
            )}
          </main>
        </div>

        {/* Clean Footer Navigation Bar with Symbols */}
        <FooterNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          calculatorMode={calculatorMode}
          setCalculatorMode={setCalculatorMode}
          historyCount={historyItems.length}
          theme={theme}
          toggleTheme={toggleTheme}
          onExportPdf={() => setIsExportModalOpen(true)}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={historyItems}
        theme={theme}
      />
    </div>
  );
}
