"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, Play, Pause, RotateCcw } from "lucide-react";

interface CountdownTimerProps {
  initialSeconds?: number;
  label?: string;
  onExpire?: () => void;
  className?: string;
  isPlaceholder?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds = 180, // Default 3 minutes
  label = "STAGE 1 TIMER // SYSTEM LOCKOUT",
  onExpire,
  className = "",
  isPlaceholder = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft === 0 && onExpire) {
        onExpire();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const progress = Math.max(0, Math.min(100, (timeLeft / initialSeconds) * 100));
  const isCritical = timeLeft < 30;

  return (
    <div
      className={`relative rounded-2xl border ${
        isCritical 
          ? "border-red-500/60 bg-[#16060a]/90 shadow-[0_0_25px_rgba(239,68,68,0.25)]" 
          : "border-cyan-500/40 bg-[#06101e]/90 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
      } backdrop-blur-md p-4 font-mono transition-colors ${className}`}
    >
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isCritical ? "text-red-400 animate-spin" : "text-cyan-400 animate-pulse"}`} />
          <span className="text-[11px] font-bold tracking-widest text-zinc-300 uppercase">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          {isPlaceholder && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              PLACEHOLDER
            </span>
          )}
          <span className={`px-2 py-0.5 rounded ${
            isCritical 
              ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-ping" 
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          }`}>
            {timeLeft > 0 ? "COUNTDOWN ACTIVE" : "LOCKDOWN"}
          </span>
        </div>
      </div>

      {/* Main Digital Clock Display */}
      <div className="flex items-baseline justify-center gap-1 py-1">
        <div className={`text-3xl sm:text-4xl font-black tracking-widest ${
          isCritical 
            ? "text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" 
            : "text-cyan-300 drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]"
        }`}>
          {formattedMinutes}
        </div>
        <span className={`text-2xl sm:text-3xl font-black ${isCritical ? "text-red-400 animate-pulse" : "text-cyan-400 animate-pulse"}`}>
          :
        </span>
        <div className={`text-3xl sm:text-4xl font-black tracking-widest ${
          isCritical 
            ? "text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" 
            : "text-cyan-300 drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]"
        }`}>
          {formattedSeconds}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-zinc-800 mt-2">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical
              ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              : "bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default CountdownTimer;
