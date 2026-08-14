import React from "react";
import {
  Calculator,
  Binary,
  TrendingUp,
  PenTool,
  History,
  Sparkles,
  Sun,
  Moon,
  FileDown,
} from "lucide-react";
import { ActiveTab, CalculatorMode, ThemeMode } from "../types";

interface FooterNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  calculatorMode: CalculatorMode;
  setCalculatorMode: (mode: CalculatorMode) => void;
  historyCount: number;
  theme?: ThemeMode;
  toggleTheme?: () => void;
  onExportPdf?: () => void;
}

export const FooterNav: React.FC<FooterNavProps> = ({
  activeTab,
  setActiveTab,
  calculatorMode,
  setCalculatorMode,
  historyCount,
  theme,
  toggleTheme,
  onExportPdf,
}) => {
  const navItems = [
    {
      id: "standard",
      title: "Standard Calculator",
      icon: Calculator,
      isActive: activeTab === "calculator" && calculatorMode === "standard",
      onClick: () => {
        setActiveTab("calculator");
        setCalculatorMode("standard");
      },
    },
    {
      id: "scientific",
      title: "Scientific Calculator",
      icon: Binary,
      isActive: activeTab === "calculator" && calculatorMode === "scientific",
      onClick: () => {
        setActiveTab("calculator");
        setCalculatorMode("scientific");
      },
    },
    {
      id: "graphing",
      title: "2D Grapher",
      icon: TrendingUp,
      isActive: activeTab === "calculator" && calculatorMode === "graphing",
      onClick: () => {
        setActiveTab("calculator");
        setCalculatorMode("graphing");
      },
    },
    {
      id: "handwriting",
      title: "Draw & Solve",
      icon: PenTool,
      isActive: activeTab === "handwriting",
      onClick: () => {
        setActiveTab("handwriting");
      },
    },
    {
      id: "history",
      title: "History",
      icon: History,
      isActive: activeTab === "history",
      badge: historyCount > 0 ? (historyCount > 99 ? "99+" : historyCount) : null,
      onClick: () => {
        setActiveTab("history");
      },
    },
    {
      id: "aisearch",
      title: "AI Math Assistant",
      icon: Sparkles,
      isActive: activeTab === "ai_search",
      onClick: () => {
        setActiveTab("ai_search");
      },
    },
  ];

  return (
    <footer
      id="bottom-navigation-bar"
      className={`fixed bottom-0 left-0 right-0 z-50 w-full border-t backdrop-blur-2xl px-2 sm:px-4 py-2 select-none shadow-2xl flex items-center justify-center transition-colors duration-200 ${
        theme === "light"
          ? "bg-white/95 border-slate-200 text-slate-700 shadow-slate-300/40"
          : "bg-slate-950/90 border-white/10 text-slate-300"
      }`}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-full">
        {/* Navigation Symbol Tabs */}
        <nav
          id="footer-symbol-nav"
          aria-label="Footer Navigation Tabs"
          className={`flex items-center gap-1 sm:gap-1.5 border backdrop-blur-2xl p-1 rounded-2xl sm:rounded-full shadow-inner transition-colors duration-200 ${
            theme === "light"
              ? "bg-slate-100/90 border-slate-200"
              : "bg-white/5 border-white/10"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`footer-nav-${item.id}`}
                onClick={item.onClick}
                className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full transition-all duration-200 flex items-center justify-center active:scale-90 shrink-0 ${
                  item.isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/40 font-bold scale-105"
                    : theme === "light"
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200/80"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={item.title}
                aria-label={item.title}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

                {/* Counter Badge for History */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 min-w-[15px] rounded-full text-[8px] sm:text-[9px] bg-sky-500 text-white font-bold border border-sky-300/40 shadow-sm leading-tight flex items-center justify-center">
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator Dot */}
                {item.isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}

                {/* Tooltip Popup on Hover */}
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 text-white border border-white/10 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-md z-50">
                  {item.title}
                </span>
              </button>
            );
          })}

          {/* Vertical Divider */}
          <div
            className={`w-[1px] h-5 mx-0.5 ${
              theme === "light" ? "bg-slate-300" : "bg-white/15"
            }`}
          />

          {/* Quick PDF Action */}
          {onExportPdf && (
            <button
              id="footer-export-pdf-btn"
              onClick={onExportPdf}
              className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full transition-all duration-200 flex items-center justify-center active:scale-90 shrink-0 ${
                theme === "light"
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Export Calculations as PDF"
              aria-label="Export Calculations as PDF"
            >
              <FileDown className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 text-white border border-white/10 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-md z-50">
                Export PDF
              </span>
            </button>
          )}

          {/* Quick Theme Toggle */}
          {toggleTheme && (
            <button
              id="footer-theme-toggle-btn"
              onClick={toggleTheme}
              className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full transition-all duration-200 flex items-center justify-center active:scale-90 shrink-0 ${
                theme === "light"
                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-100/80"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-slate-900/95 text-white border border-white/10 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-md z-50">
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            </button>
          )}
        </nav>
      </div>
    </footer>
  );
};

