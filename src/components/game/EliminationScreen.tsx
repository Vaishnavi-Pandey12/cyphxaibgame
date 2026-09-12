"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resetToLobby } from "@/lib/gameEngine";
import { Skull, RotateCcw, AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Red ambient glow */}
      <div className="fixed inset-0 bg-[#920703]/20 pointer-events-none z-0" />
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#ff544b]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center bg-[#131313] border-2 border-[#ff544b] p-8 shadow-[0_0_60px_rgba(255,84,75,0.6)]">
        {/* Animated skull */}
        <div className="p-5 bg-[#920703]/30 border-2 border-[#ff544b] rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,84,75,0.5)] animate-pulse">
          <Skull className="w-16 h-16 text-[#ff544b]" />
        </div>

        {roundName && (
          <div className="text-xs font-bold text-[#ffb4ab] tracking-[0.25em] uppercase mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#ff544b]" />
            <span>{roundName}</span>
          </div>
        )}

        <h1 className="font-['Cinzel'] text-4xl sm:text-5xl font-black text-[#ffdad6] tracking-wider uppercase mb-3 drop-shadow-[0_2px_15px_rgba(255,84,75,0.8)]">
          {title}
        </h1>

        <div className="w-full p-4 bg-[#0e0e0e] border border-[#ff544b]/40 text-xs text-[#ffdad6] mb-6 leading-relaxed font-mono">
          {message}
        </div>

        {/* Countdown notice */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-xs text-[#af8783] font-bold mb-2 uppercase">
            <span>RETURNING TO LOBBY</span>
            <span className="text-[#ff544b] font-mono text-sm">{countdown}s</span>
          </div>
          <div className="w-full bg-[#201f1f] h-2 overflow-hidden border border-[#353534]">
            <div
              className="bg-[#ff544b] h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(255,84,75,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Restart Action */}
        <button
          onClick={handleReturnToLobby}
          disabled={isResetting}
          className="w-full py-4 px-6 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono font-black text-xs sm:text-sm tracking-[0.25em] uppercase transition-all shadow-[0_0_30px_rgba(255,84,75,0.6)] flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          {isResetting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#5c0005] border-t-transparent rounded-full animate-spin" />
              RESETTING LOBBY...
            </span>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>RETURN TO LOBBY & PLAY AGAIN</span>
            </>
          )}
        </button>

        <p className="mt-4 text-[11px] text-[#af8783] uppercase tracking-wider">
          Simulation will reset and populate fresh operative slots.
        </p>
      </div>
    </div>
  );
}
