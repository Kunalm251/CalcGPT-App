import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  buttonId?: string;
}

// Function to convert spoken math terms into math notation
const convertSpokenToMath = (text: string): string => {
  let cleaned = text;

  const mathReplacements: Array<[RegExp, string]> = [
    [/\bplus\b/gi, "+"],
    [/\bminus\b/gi, "-"],
    [/\bmultiplied by\b/gi, "*"],
    [/\btimes\b/gi, "*"],
    [/\bdivided by\b/gi, "/"],
    [/\bover\b/gi, "/"],
    [/\bsquared\b/gi, "^2"],
    [/\bcubed\b/gi, "^3"],
    [/\bto the power of\b/gi, "^"],
    [/\bequals?\b/gi, "="],
    [/\bsquare root of\b/gi, "√"],
    [/\broot of\b/gi, "√"],
    [/\bpi\b/gi, "π"],
    [/\bintegral of\b/gi, "∫"],
    [/\bdelta\b/gi, "Δ"],
    [/\bpercent\b/gi, "%"],
  ];

  for (const [regex, replacement] of mathReplacements) {
    cleaned = cleaned.replace(regex, replacement);
  }

  return cleaned;
};

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  className = "",
  buttonId = "voice-search-mic-btn",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusText, setStatusText] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatusText("Voice input not supported in this browser");
      setTimeout(() => setStatusText(null), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText("Listening... Speak equation");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const formattedMath = convertSpokenToMath(transcript);
        onTranscript(formattedMath);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setStatusText("Microphone permission denied");
        } else if (event.error === "no-speech") {
          setStatusText("No speech detected");
        } else {
          setStatusText(`Error: ${event.error}`);
        }
        setTimeout(() => setStatusText(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setStatusText(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setStatusText(null);
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`text-slate-600 opacity-50 p-1 cursor-not-allowed ${className}`}
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        id={buttonId}
        type="button"
        onClick={toggleListening}
        className={`p-1.5 rounded-xl transition-all flex items-center justify-center relative ${
          isListening
            ? "bg-rose-500/30 text-rose-300 border border-rose-500/50 ring-2 ring-rose-500/50 animate-pulse"
            : "text-slate-400 hover:text-white hover:bg-white/10"
        } ${className}`}
        title={isListening ? "Listening... Click to stop" : "Speak math problem (Voice-to-Text)"}
      >
        {isListening ? (
          <div className="relative flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </div>
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Floating Listening Feedback Status Badge */}
      {statusText && (
        <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-slate-900/95 border border-white/15 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-fade-in">
          {isListening && <Loader2 className="w-3 h-3 text-rose-400 animate-spin" />}
          <span>{statusText}</span>
        </div>
      )}
    </div>
  );
};
