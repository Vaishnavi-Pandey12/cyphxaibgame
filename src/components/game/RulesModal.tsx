"use client";

import React, { useEffect, useState } from "react";
import { STAGES_LIST } from "@/lib/stages";
import { ShieldCheck, X } from "lucide-react";

interface RulesModalProps {
  roundIndex: number; // 0-based (0 = round 1)
  onDismiss: () => void;
}

export function RulesModal({ roundIndex, onDismiss }: RulesModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const stage = STAGES_LIST[roundIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismiss]);

  if (!stage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-[#0e0e0e]/80 backdrop-blur-sm" />

      <div className="relative z-10 max-w-lg w-full mx-4 bg-[#1c1b1b] border-2 border-[#ff544b] shadow-[0_0_60px_rgba(255,84,75,0.4)] p-8 font-mono">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[#ff544b] font-bold text-xs tracking-[0.25em] mb-1 flex items-center gap-1.5">
              <span>{stage.suitSymbol}</span>
              <span>
                TRIAL {String(stage.stageNumber).padStart(2, "0")} //
                {stage.suitCategory}
              </span>
            </div>
            <h2 className="font-['Cinzel'] text-2xl font-black text-[#ffdad6] tracking-wider uppercase">
              {stage.name}
            </h2>
            <p className="text-[10px] text-[#af8783] mt-0.5 uppercase tracking-widest">
              {stage.subTitle}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 border border-[#353534] hover:border-[#ff544b] text-[#af8783] hover:text-[#ff544b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rules */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ffb4ab] uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-[#ff544b]" /> PROTOCOL RULES
          </div>
          {stage.rules.map((rule, i) => (
            <div key={i} className="flex gap-3 text-xs text-[#af8783] leading-relaxed">
              <span className="text-[#ff544b] font-black shrink-0">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span>{rule}</span>
            </div>
          ))}
        </div>

        {/* Timer bar */}
        <div>
          <div className="flex justify-between items-center text-[10px] text-[#af8783] mb-1.5">
            <span className="font-bold uppercase tracking-widest">
              AUTO-DISMISS IN
            </span>
            <span className="text-[#ff544b] font-black text-base font-mono">
              {secondsLeft}s
            </span>
          </div>
          <div className="w-full bg-[#0e0e0e] h-1.5 border border-[#353534] overflow-hidden">
            <div
              className="h-full bg-[#ff544b] transition-all duration-1000"
              style={{ width: `${(secondsLeft / 15) * 100}%` }}
            />
          </div>
          <button
            onClick={onDismiss}
            className="mt-4 w-full py-3 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
          >
            I UNDERSTAND — ENTER TRIAL
          </button>
        </div>
      </div>
    </div>
  );
}
