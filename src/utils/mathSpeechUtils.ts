/**
 * Utility to convert complex mathematical expressions, LaTeX notation,
 * and mathematical solutions into natural, fluent spoken English for Text-to-Speech synthesis.
 */

export function convertMathToSpokenEnglish(text: string): string {
  if (!text) return "";

  let spoken = text;

  // Replace common LaTeX expressions
  spoken = spoken.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1) over ($2)");
  spoken = spoken.replace(/\\sqrt\{([^{}]+)\}/g, "square root of $1");
  spoken = spoken.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, "$1th root of $2");
  spoken = spoken.replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, "definite integral from $1 to $2 of ");
  spoken = spoken.replace(/\\int/g, "integral of ");
  spoken = spoken.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, "sum from $1 to $2 of ");
  spoken = spoken.replace(/\\lim_\{([^}]+)\}/g, "limit as $1 of ");
  spoken = spoken.replace(/\\partial/g, "partial derivative ");
  spoken = spoken.replace(/\\infty/g, "infinity");
  spoken = spoken.replace(/\\cdot/g, " times ");
  spoken = spoken.replace(/\\times/g, " times ");
  spoken = spoken.replace(/\\div/g, " divided by ");
  spoken = spoken.replace(/\\pm/g, "plus or minus ");
  spoken = spoken.replace(/\\leq?/g, " is less than or equal to ");
  spoken = spoken.replace(/\\geq?/g, " is greater than or equal to ");
  spoken = spoken.replace(/\\neq/g, " is not equal to ");
  spoken = spoken.replace(/\\approx/g, " is approximately ");
  spoken = spoken.replace(/\\rightarrow/g, " approaches ");
  spoken = spoken.replace(/\\to/g, " approaches ");

  // Greek letters
  const greekLetters: Record<string, string> = {
    "\\alpha": "alpha",
    "\\beta": "beta",
    "\\gamma": "gamma",
    "\\delta": "delta",
    "\\Delta": "delta",
    "\\epsilon": "epsilon",
    "\\theta": "theta",
    "\\lambda": "lambda",
    "\\mu": "micro",
    "\\pi": "pi",
    "\\sigma": "sigma",
    "\\Sigma": "sum",
    "\\phi": "phi",
    "\\omega": "omega",
    "π": "pi",
    "θ": "theta",
    "Δ": "delta",
    "λ": "lambda",
    "μ": "micro",
    "σ": "sigma",
    "Σ": "sum",
    "∫": "integral of ",
    "√": "square root of ",
    "≈": " approximately equals ",
    "≠": " is not equal to ",
    "≤": " is less than or equal to ",
    "≥": " is greater than or equal to ",
    "±": " plus or minus ",
    "∞": " infinity ",
  };

  for (const [sym, word] of Object.entries(greekLetters)) {
    spoken = spoken.replaceAll(sym, ` ${word} `);
  }

  // Powers and exponents
  spoken = spoken.replace(/([a-zA-Z0-9\)]+)\^2\b/g, "$1 squared");
  spoken = spoken.replace(/([a-zA-Z0-9\)]+)\^3\b/g, "$1 cubed");
  spoken = spoken.replace(/([a-zA-Z0-9\)]+)\^([a-zA-Z0-9]+)/g, "$1 to the power of $2");
  spoken = spoken.replace(/([a-zA-Z0-9\)]+)\^\{([^{}]+)\}/g, "$1 to the power of $2");

  // Functions
  spoken = spoken.replace(/\bsin\(([^)]+)\)/gi, "sine of $1");
  spoken = spoken.replace(/\bcos\(([^)]+)\)/gi, "cosine of $1");
  spoken = spoken.replace(/\btan\(([^)]+)\)/gi, "tangent of $1");
  spoken = spoken.replace(/\bln\(([^)]+)\)/gi, "natural log of $1");
  spoken = spoken.replace(/\blog\(([^)]+)\)/gi, "log of $1");
  spoken = spoken.replace(/\be\^([a-zA-Z0-9]+)/gi, "e to the power of $1");
  spoken = spoken.replace(/\be\^\{([^{}]+)\}/gi, "e to the power of $1");
  spoken = spoken.replace(/\bf\(([a-zA-Z0-9]+)\)/g, "f of $1");
  spoken = spoken.replace(/\bf'\(([a-zA-Z0-9]+)\)/g, "f prime of $1");
  spoken = spoken.replace(/\bf''\(([a-zA-Z0-9]+)\)/g, "f double prime of $1");
  spoken = spoken.replace(/\bg\(([a-zA-Z0-9]+)\)/g, "g of $1");

  // Operators and math symbols
  spoken = spoken.replace(/\*/g, " times ");
  spoken = spoken.replace(/\//g, " divided by ");
  spoken = spoken.replace(/\+/g, " plus ");
  spoken = spoken.replace(/-/g, " minus ");
  spoken = spoken.replace(/=/g, " equals ");

  // Cleanup redundant spaces and markdown characters
  spoken = spoken.replace(/[\*\_#`]/g, " ");
  spoken = spoken.replace(/\s+/g, " ").trim();

  return spoken;
}

/**
 * Builds a structured, complete audio script from an AI search math result.
 */
export function buildAudioScriptFromAiResult(result: {
  title?: string;
  expression?: string;
  result: string;
  steps?: string[];
  explanation?: string;
  keyFormulas?: string[];
}): { fullText: string; segments: { label: string; text: string }[] } {
  const segments: { label: string; text: string }[] = [];

  // 1. Title / Problem Statement
  if (result.title) {
    segments.push({
      label: "Problem",
      text: `${result.title}.`,
    });
  } else if (result.expression) {
    segments.push({
      label: "Problem",
      text: `Solving the mathematical problem: ${convertMathToSpokenEnglish(result.expression)}.`,
    });
  }

  // 2. Final Answer Highlight
  if (result.result) {
    segments.push({
      label: "Final Answer",
      text: `The final result is ${convertMathToSpokenEnglish(result.result)}.`,
    });
  }

  // 3. Key Formulas
  if (result.keyFormulas && result.keyFormulas.length > 0) {
    const formulasSpoken = result.keyFormulas
      .map((f) => convertMathToSpokenEnglish(f))
      .join(", and ");
    segments.push({
      label: "Formulas",
      text: `Key formulas used: ${formulasSpoken}.`,
    });
  }

  // 4. Step-by-Step Derivation
  if (result.steps && result.steps.length > 0) {
    result.steps.forEach((step, index) => {
      segments.push({
        label: `Step ${index + 1}`,
        text: `Step ${index + 1}: ${convertMathToSpokenEnglish(step)}.`,
      });
    });
  }

  // 5. Conceptual explanation
  if (result.explanation) {
    segments.push({
      label: "Summary",
      text: `In summary: ${convertMathToSpokenEnglish(result.explanation)}.`,
    });
  }

  const fullText = segments.map((s) => s.text).join(" ");

  return { fullText, segments };
}
