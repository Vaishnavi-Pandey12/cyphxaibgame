"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resetToLobby } from "@/lib/gameEngine";
import { Skull, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";

interface EliminationScreenProps {
  title?: string;
  message: string;
  roundName?: string;
  autoRedirectSeconds?: number;
}

export function EliminationScreen({
  title = "YOU DIED",
  message,
  roundName,
  autoRedirectSeconds = 5,
}: EliminationScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState<number>(autoRedirectSeconds);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleReturnToLobby = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await resetToLobby(user?.uid);
      router.push("/lobby");
    } catch (err) {
      console.error("Failed to reset lobby:", err);
      router.push("/lobby");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleReturnToLobby();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const progressPercent = ((autoRedirectSeconds - countdown) / autoRedirectSeconds) * 100;

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Red ambient glow */}
      <div className="fixed inset-0 bg-red-950/15 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-0" />
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center">
        {/* Animated skull */}
        <div className="p-5 bg-red-950/40 border-2 border-red-500/60 rounded-3xl mb-6 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse">
          <Skull className="w-16 h-16 text-red-500" />
        </div>

        {roundName && (
          <div className="text-[11px] font-bold text-red-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>{roundName}</span>
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-red-400 tracking-wider mb-3">
          {title}
        </h1>

        <div className="w-full p-4 rounded-xl bg-black/60 border border-red-500/30 text-xs text-red-300/90 mb-6 leading-relaxed">
          {message}
        </div>

        {/* Countdown notice */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-bold mb-2">
            <span>RETURNING TO LOBBY</span>
            <span className="text-red-400 font-mono">{countdown}s</span>
          </div>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-red-500 h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Restart Action */}
        <button
          onClick={handleReturnToLobby}
          disabled={isResetting}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {isResetting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              RESTARTING LOBBY...
            </span>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>RETURN TO LOBBY & PLAY AGAIN</span>
            </>
          )}
        </button>

        <p className="mt-4 text-[11px] text-zinc-600">
          Simulation will reset and populate fresh operative slots.
        </p>
      </div>
    </div>
  );
}
