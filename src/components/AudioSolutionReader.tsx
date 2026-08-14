import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Gauge,
  Check,
} from "lucide-react";
import { buildAudioScriptFromAiResult } from "../utils/mathSpeechUtils";

interface AudioSolutionReaderProps {
  solutionData: {
    title?: string;
    expression?: string;
    result: string;
    steps?: string[];
    explanation?: string;
    keyFormulas?: string[];
  };
  compact?: boolean;
}

export const AudioSolutionReader: React.FC<AudioSolutionReaderProps> = ({
  solutionData,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1);
  const [rate, setRate] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying && !isPaused;

  const scriptData = React.useMemo(
    () => buildAudioScriptFromAiResult(solutionData),
    [solutionData]
  );

  // Initialize Speech Synthesis & Load Voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Prefer high-quality English natural voices (e.g., Google US English, Samantha, Daniel, Natural)
      const englishVoices = availableVoices.filter((v) =>
        v.lang.startsWith("en")
      );
      const preferred =
        englishVoices.find((v) =>
          /google|natural|premium|samantha|daniel|karen/i.test(v.name)
        ) || englishVoices[0] || availableVoices[0];

      if (preferred && !selectedVoice) {
        setSelectedVoice(preferred);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop playback when solution data changes
  useEffect(() => {
    stopSpeech();
  }, [solutionData]);

  const speakSegment = (index: number) => {
    if (index >= scriptData.segments.length) {
      // Completed all segments
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSegmentIndex(-1);
      return;
    }

    setCurrentSegmentIndex(index);
    const segment = scriptData.segments[index];

    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(segment.text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      // Chain to next segment if still playing
      speakSegment(index + 1);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis segment error:", e);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSegmentIndex(-1);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startPlayback = () => {
    if (!("speechSynthesis" in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    speakSegment(0);
  };

  const pausePlayback = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSegmentIndex(-1);
  };

  const handleRateChange = () => {
    const rates = [0.8, 1.0, 1.25];
    const nextIndex = (rates.indexOf(rate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setRate(nextRate);

    // If currently speaking, restart current segment with new rate
    if (isPlaying && !isPaused && currentSegmentIndex >= 0) {
      speakSegment(currentSegmentIndex);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={isPlaying && !isPaused ? pausePlayback : startPlayback}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isPlaying && !isPaused
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-white/10 hover:bg-white/15 border border-white/10 text-cyan-300"
          }`}
          title="Read solution aloud with speech synthesis"
        >
          {isPlaying && !isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Voice</span>
            </>
          ) : isPaused ? (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </>
          )}
        </button>

        {isPlaying && (
          <button
            onClick={stopSpeech}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-rose-400 transition-colors"
            title="Stop Speech"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5 backdrop-blur-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Header & Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              isPlaying && !isPaused
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/20"
                : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            {isPlaying && !isPaused ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Voice Solution Narrator
              </span>
              {isPlaying && !isPaused && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Reading Aloud
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {isPlaying && currentSegmentIndex >= 0
                ? `Currently reading: ${scriptData.segments[currentSegmentIndex]?.label || "Solution"}`
                : "Listen to the step-by-step mathematical derivation"}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          {/* Speed Toggle */}
          <button
            onClick={handleRateChange}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
            title="Toggle Narration Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span>{rate}x</span>
          </button>

          {/* Play / Pause */}
          {isPlaying && !isPaused ? (
            <button
              onClick={pausePlayback}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
              title="Pause playback"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={startPlayback}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 border border-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
              title="Resume playback"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={startPlayback}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 border border-blue-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              title="Read complete math breakdown aloud"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Read Aloud</span>
            </button>
          )}

          {/* Stop Button */}
          {isPlaying && (
            <button
              onClick={stopSpeech}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 transition-colors"
              title="Stop reading"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Segment Progress Pills */}
      {scriptData.segments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Jump to section:
          </span>
          {scriptData.segments.map((seg, idx) => {
            const isCurrent = isPlaying && currentSegmentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsPlaying(true);
                  setIsPaused(false);
                  speakSegment(idx);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  isCurrent
                    ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                }`}
              >
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Audio Wave Visualizer while active */}
      {isPlaying && !isPaused && (
        <div className="flex items-center justify-center gap-1 py-1">
          {[40, 70, 30, 90, 50, 80, 45, 60, 85, 35].map((height, i) => (
            <span
              key={i}
              className="w-1 bg-cyan-400 rounded-full"
              style={{
                height: `${Math.max(6, (height * 0.2))}px`,
                animation: `bounce 0.8s ease-in-out infinite alternate ${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
