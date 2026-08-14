import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 10MB limit for canvas image data
app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// AI Search & Math Query Endpoint
app.post("/api/ai-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query string is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are an expert AI math and science assistant built into a smart calculator.
Answer the following math or science question clearly and precisely.
If it involves a calculation or equation, provide step-by-step breakdown and the final numerical or simplified symbolic answer.

Query: "${query}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Short concise topic title for the query",
            },
            expression: {
              type: Type.STRING,
              description: "The primary mathematical expression or equation parsed from query, if applicable",
            },
            result: {
              type: Type.STRING,
              description: "The final concise result or answer value",
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Sequential list of steps or explanations",
            },
            explanation: {
              type: Type.STRING,
              description: "Detailed summary explanation",
            },
            keyFormulas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key relevant mathematical/scientific formulas used",
            },
          },
          required: ["title", "result", "steps", "explanation"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: any) {
    console.error("AI Search Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process AI math query",
    });
  }
});

// Recognize & Solve Handwritten Math from Canvas Base64 Image
app.post("/api/recognize-handwriting", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 image data is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: base64Data,
      },
    };

    const textPart = {
      text: `Analyze this image containing handwritten mathematics or calculations.
Identify the handwritten equations, numbers, symbols, matrix, calculus integral/derivative, geometry, or arithmetic expressions.
Solve the recognized mathematical problem accurately step-by-step.
If multiple equations are present, recognize all of them and solve the primary calculation.
Return a structured JSON response.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recognizedEquation: {
              type: Type.STRING,
              description: "The recognized handwritten math equation or expression in clean standard/LaTeX format",
            },
            result: {
              type: Type.STRING,
              description: "The final computed numerical or simplified algebraic result",
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Clear step-by-step derivation or computation path",
            },
            explanation: {
              type: Type.STRING,
              description: "Short explanation of the math concepts used",
            },
            isMathEquation: {
              type: Type.BOOLEAN,
              description: "True if valid mathematical content was detected, false otherwise",
            },
          },
          required: ["recognizedEquation", "result", "steps", "explanation", "isMathEquation"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: any) {
    console.error("Handwriting recognition error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process handwritten equation",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
