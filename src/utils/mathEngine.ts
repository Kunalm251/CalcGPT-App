import { AngleUnit } from "../types";

// Helper for factorial
function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // Prevent overflow
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Convert degrees to radians if needed
function toRadians(deg: number, angleUnit: AngleUnit): number {
  return angleUnit === "deg" ? (deg * Math.PI) / 180 : deg;
}

function fromRadians(rad: number, angleUnit: AngleUnit): number {
  return angleUnit === "deg" ? (rad * 180) / Math.PI : rad;
}

/**
 * Format result number to clean string
 */
export function formatResultNumber(num: number, precision: number = 10): string {
  if (isNaN(num)) return "Error";
  if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";

  // Check if integer
  if (Number.isInteger(num)) {
    return num.toLocaleString("en-US", { useGrouping: false });
  }

  // Very large or very small numbers -> scientific notation
  const absNum = Math.abs(num);
  if (absNum > 1e12 || (absNum < 1e-6 && absNum > 0)) {
    return num.toExponential(6).replace(/\.0+e/, "e");
  }

  // Standard float rounding
  const rounded = Number(num.toFixed(precision));
  return rounded.toString();
}

/**
 * Evaluates math expression safely
 */
export function evaluateMathExpression(
  expression: string,
  angleUnit: AngleUnit = "deg"
): { result: string; numericValue: number | null; error: string | null } {
  if (!expression || !expression.trim()) {
    return { result: "", numericValue: null, error: null };
  }

  try {
    let expr = expression.trim();

    // Replace display symbols with JS math operators
    expr = expr.replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e/g, `(${Math.E})`)
      .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
      .replace(/√(\d+(\.\d+)?)/g, "Math.sqrt($1)")
      .replace(/%/g, "*0.01");

    // Handle Factorials: e.g. 5! -> factorial(5)
    expr = expr.replace(/(\d+(\.\d+)?|\([^)]+\))!/g, (_match, p1) => {
      const val = parseFloat(p1);
      return isNaN(val) ? `factorial(${p1})` : `${factorial(val)}`;
    });

    // Handle Power operator: e.g. 2^3 -> Math.pow(2, 3) or **
    expr = expr.replace(/\^/g, "**");

    // Handle Trigonometric & Logarithmic functions
    // Replace sin, cos, tan with angle-adjusted math functions
    const scope = {
      sin: (x: number) => Math.sin(toRadians(x, angleUnit)),
      cos: (x: number) => Math.cos(toRadians(x, angleUnit)),
      tan: (x: number) => {
        const rad = toRadians(x, angleUnit);
        if (Math.abs(Math.cos(rad)) < 1e-12) return NaN; // Tangent undefined at 90 deg
        return Math.tan(rad);
      },
      asin: (x: number) => fromRadians(Math.asin(x), angleUnit),
      acos: (x: number) => fromRadians(Math.acos(x), angleUnit),
      atan: (x: number) => fromRadians(Math.atan(x), angleUnit),
      sinh: (x: number) => Math.sinh(x),
      cosh: (x: number) => Math.cosh(x),
      tanh: (x: number) => Math.tanh(x),
      log: (x: number) => Math.log10(x),
      ln: (x: number) => Math.log(x),
      sqrt: (x: number) => Math.sqrt(x),
      abs: (x: number) => Math.abs(x),
      factorial: (x: number) => factorial(x),
    };

    // Sanitize string to prevent execution of arbitrary code
    const validChars = /^[0-9+\-*/().,^%\s*e\bMath.sqrtMath.powfactorial\b]+$/;
    
    // Create function runner with scoped math
    const mathFn = new Function(
      "sin", "cos", "tan", "asin", "acos", "atan",
      "sinh", "cosh", "tanh", "log", "ln", "sqrt", "abs", "factorial",
      `"use strict"; return (${expr});`
    );

    const val = mathFn(
      scope.sin, scope.cos, scope.tan, scope.asin, scope.acos, scope.atan,
      scope.sinh, scope.cosh, scope.tanh, scope.log, scope.ln, scope.sqrt, scope.abs, scope.factorial
    );

    if (typeof val !== "number" || isNaN(val)) {
      return { result: "Error", numericValue: null, error: "Invalid calculation" };
    }

    if (!isFinite(val)) {
      return { result: val > 0 ? "Infinity" : "-Infinity", numericValue: val, error: null };
    }

    const formatted = formatResultNumber(val);
    return { result: formatted, numericValue: val, error: null };
  } catch (err: any) {
    return { result: "Error", numericValue: null, error: "Syntax Error" };
  }
}
