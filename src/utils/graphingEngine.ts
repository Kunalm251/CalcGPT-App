/**
 * Mathematical parsing and evaluation engine for 2D Cartesian graphing.
 */

export interface PlotFunction {
  id: string;
  expression: string;
  color: string;
  label: string;
  visible: boolean;
}

export interface GraphBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface KeyPoint {
  x: number;
  y: number;
  type: "root" | "y-intercept" | "extrema";
  label: string;
}

/**
 * Transforms a user mathematical equation string into a safe, executable JS function f(x).
 */
export function compileFunction(rawExpr: string): (x: number) => number {
  if (!rawExpr || !rawExpr.trim()) {
    return () => NaN;
  }

  let expr = rawExpr.trim().toLowerCase();

  // Strip 'y=' or 'f(x)='
  expr = expr.replace(/^y\s*=\s*/i, "");
  expr = expr.replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, "");
  expr = expr.replace(/^g\s*\(\s*x\s*\)\s*=\s*/i, "");

  // Replace special characters
  expr = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\bpi\b/g, `(${Math.PI})`)
    .replace(/√\(([^)]+)\)/g, "sqrt($1)")
    .replace(/√([a-z0-9]+)/g, "sqrt($1)")
    .replace(/\|([^|]+)\|/g, "abs($1)");

  // Handle implicit multiplication (e.g. 2x -> 2*x, 3sin -> 3*sin, (x+1)(x-1) -> (x+1)*(x-1))
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
  expr = expr.replace(/(\))([a-zA-Z0-9(])/g, "$1*$2");
  expr = expr.replace(/([a-zA-Z0-9])(\()/g, "$1*$2");

  // Handle powers: x^2 -> pow(x, 2) or **
  expr = expr.replace(/\^/g, "**");

  // Handle e^x
  expr = expr.replace(/\be\*\*([a-zA-Z0-9(])/g, `(${Math.E})**$1`);
  expr = expr.replace(/\be\b/g, `(${Math.E})`);

  try {
    const mathScope = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      log: Math.log10,
      ln: Math.log,
      exp: Math.exp,
      sqrt: Math.sqrt,
      abs: Math.abs,
      pow: Math.pow,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
    };

    const fn = new Function(
      "x",
      "sin", "cos", "tan", "asin", "acos", "atan",
      "sinh", "cosh", "tanh", "log", "ln", "exp", "sqrt", "abs", "pow", "floor", "ceil", "round",
      `"use strict"; 
       try {
         const res = (${expr});
         return typeof res === 'number' ? res : NaN;
       } catch (e) {
         return NaN;
       }`
    );

    return (xVal: number) => {
      try {
        const val = fn(
          xVal,
          mathScope.sin, mathScope.cos, mathScope.tan,
          mathScope.asin, mathScope.acos, mathScope.atan,
          mathScope.sinh, mathScope.cosh, mathScope.tanh,
          mathScope.log, mathScope.ln, mathScope.exp,
          mathScope.sqrt, mathScope.abs, mathScope.pow,
          mathScope.floor, mathScope.ceil, mathScope.round
        );
        return isFinite(val) ? val : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    return () => NaN;
  }
}

/**
 * Finds key points such as Roots (x-intercepts), Y-intercept, and Extrema within bounds
 */
export function findKeyPoints(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  samples: number = 300
): KeyPoint[] {
  const points: KeyPoint[] = [];
  const step = (xMax - xMin) / samples;

  // 1. Y-Intercept: f(0) if 0 in [xMin, xMax]
  if (xMin <= 0 && xMax >= 0) {
    const y0 = fn(0);
    if (!isNaN(y0) && isFinite(y0)) {
      points.push({
        x: 0,
        y: Number(y0.toFixed(4)),
        type: "y-intercept",
        label: `Y-Int (0, ${Number(y0.toFixed(3))})`,
      });
    }
  }

  let prevX = xMin;
  let prevY = fn(prevX);
  let prevSlope: number | null = null;

  for (let i = 1; i <= samples; i++) {
    const currX = xMin + i * step;
    const currY = fn(currX);

    if (isNaN(currY) || !isFinite(currY) || isNaN(prevY) || !isFinite(prevY)) {
      prevX = currX;
      prevY = currY;
      prevSlope = null;
      continue;
    }

    // Check for root (sign change) and avoid asymptote jump
    if (prevY * currY <= 0 && Math.abs(currY - prevY) < (xMax - xMin) * 2) {
      // Bisection method to pinpoint exact root
      let low = prevX;
      let high = currX;
      let rootX = currX;
      for (let iter = 0; iter < 12; iter++) {
        const mid = (low + high) / 2;
        const midY = fn(mid);
        if (Math.abs(midY) < 1e-6) {
          rootX = mid;
          break;
        }
        if (fn(low) * midY <= 0) {
          high = mid;
        } else {
          low = mid;
        }
        rootX = mid;
      }

      // Check if duplicate root
      if (!points.some((p) => Math.abs(p.x - rootX) < step)) {
        points.push({
          x: Number(rootX.toFixed(4)),
          y: 0,
          type: "root",
          label: `Root (${Number(rootX.toFixed(3))}, 0)`,
        });
      }
    }

    // Check for local Extrema (slope sign change)
    const currSlope = (currY - prevY) / step;
    if (prevSlope !== null && prevSlope * currSlope < 0 && Math.abs(currSlope - prevSlope) < 100) {
      const extremaX = (prevX + currX) / 2;
      const extremaY = fn(extremaX);
      if (!isNaN(extremaY) && isFinite(extremaY)) {
        const isMax = prevSlope > 0;
        points.push({
          x: Number(extremaX.toFixed(4)),
          y: Number(extremaY.toFixed(4)),
          type: "extrema",
          label: `${isMax ? "Max" : "Min"} (${Number(extremaX.toFixed(3))}, ${Number(extremaY.toFixed(3))})`,
        });
      }
    }

    prevSlope = currSlope;
    prevX = currX;
    prevY = currY;
  }

  return points.slice(0, 8); // Top 8 key points
}
