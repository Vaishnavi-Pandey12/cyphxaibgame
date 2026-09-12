"use client";

import React, { useState } from "react";
import { Zap, Shield, Skull, Heart, RefreshCw, AlertTriangle, Crosshair } from "lucide-react";

interface LaserGridProps {
  speed: number;
  onLifeLost?: (remaining: number) => void;
  className?: string;
}

export const LaserGrid: React.FC<LaserGridProps> = ({
  speed,
  onLifeLost,
  className = "",
}) => {
  const [lives, setLives] = useState(3);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [lastHit, setLastHit] = useState<{ r: number; c: number } | null>(null);

  // Derive active laser row and column from speed % 5
  const speedInt = Math.abs(Math.floor(speed));
  const activeLaserRow = speedInt % 5;
  const activeLaserCol = (speedInt + 2) % 5;

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });

    const isLaser = r === activeLaserRow || c === activeLaserCol;
    if (isLaser && lives > 0) {
      setLastHit({ r, c });
      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);
      if (onLifeLost) onLifeLost(nextLives);
    }
  };

  const handleReset = () => {
    setLives(3);
    setSelectedCell(null);
    setLastHit(null);
  };

  return (
    <div className={`rounded-3xl border-2 border-cyan-500/40 bg-[#060c18]/95 backdrop-blur-xl p-6 sm:p-8 font-mono shadow-[0_0_35px_rgba(0,240,255,0.15)] ${className}`}>
      {/* Laser Grid HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-cyan-300 uppercase">
              5x5 QUANTUM LASER MATRIX
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Calibrated to aircraft speed: <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded border border-zinc-800">{speed} KTS</code> &bull; Active Row: <strong className="text-red-400">R{activeLaserRow + 1}</strong> &bull; Active Col: <strong className="text-red-400">C{activeLaserCol + 1}</strong>
          </p>
        </div>

        {/* 3 Lives Counter Display */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-zinc-700 flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-bold uppercase">LIVES:</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-5 h-5 transition-all duration-300 ${
                    heartIndex <= lives
                      ? "fill-red-500 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110"
                      : "fill-zinc-800 text-zinc-700 scale-90"
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-black ml-1 ${lives === 0 ? "text-red-500 animate-pulse" : "text-emerald-400"}`}>
              {lives}/3
            </span>
          </div>

          {lives === 0 && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RESPAWN</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Alert if Lives Depleted */}
      {lives === 0 && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/80 bg-red-950/80 text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <Skull className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-black tracking-wider uppercase block">
                SYSTEM BREACH: ALL 3 LIVES EXHAUSTED!
              </span>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Laser energy severed your neural uplink. Click RESPAWN to recalibrate shields.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-red-500 text-black font-black text-xs uppercase tracking-wider hover:bg-red-400 cursor-pointer"
          >
            RECHARGE
          </button>
        </div>
      )}

      {/* Column Laser Indicators */}
      <div className="grid grid-cols-5 gap-3 max-w-md mx-auto mb-2 text-center text-xs font-bold font-mono">
        {[0, 1, 2, 3, 4].map((c) => {
          const isColLaser = c === activeLaserCol;
          return (
            <div
              key={`col-${c}`}
              className={`py-1 rounded-lg border text-[10px] tracking-wider uppercase transition-colors ${
                isColLaser
                  ? "bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"
                  : "bg-black/40 border-zinc-800 text-zinc-500"
              }`}
            >
              COL {c + 1}
              {isColLaser && <span className="block text-[8px] text-red-300 font-black">LASER</span>}
            </div>
          );
        })}
      </div>

      {/* 5x5 Main Grid Container */}
      <div className="relative max-w-md mx-auto aspect-square">
        {/* Horizontal Laser Beam Line */}
        <div
          className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_#ef4444] z-20 pointer-events-none transition-all duration-500"
          style={{ top: `${(activeLaserRow + 0.5) * 20}%` }}
        />
        {/* Vertical Laser Beam Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_15px_#ef4444] z-20 pointer-events-none transition-all duration-500"
          style={{ left: `${(activeLaserCol + 0.5) * 20}%` }}
        />

        <div className="grid grid-cols-5 grid-rows-5 gap-2.5 h-full w-full">
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1, 2, 3, 4].map((c) => {
              const isLaser = r === activeLaserRow || c === activeLaserCol;
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isIntersection = r === activeLaserRow && c === activeLaserCol;

              return (
                <button
                  key={`cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={lives === 0}
                  className={`group relative rounded-xl border flex flex-col items-center justify-center p-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                    isLaser
                      ? isIntersection
                        ? "border-red-500 bg-red-950/90 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse"
                        : "border-red-500/70 bg-red-950/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  } ${isSelected ? "ring-2 ring-cyan-400 scale-105" : ""}`}
                >
                  <span className="text-[9px] text-zinc-500 font-mono mb-1">
                    {r + 1},{c + 1}
                  </span>

                  {isLaser ? (
                    <Zap className={`w-5 h-5 ${isIntersection ? "text-amber-300 animate-spin" : "text-red-400 animate-pulse"}`} />
                  ) : (
                    <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  )}

                  <span className={`text-[9px] font-bold mt-1 uppercase ${
                    isLaser ? "text-red-300" : "text-emerald-300"
                  }`}>
                    {isLaser ? "BEAM" : "SAFE"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Grid Legend & Calibration Footer */}
      <div className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          <span>ACTIVE RED LASER (COLLISION HAZARD)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span>SAFE GREEN CELL (PASSAGEWAY)</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-300">
          <Crosshair className="w-4 h-4" />
          <span>CLICK ANY CELL TO NAVIGATE</span>
        </div>
      </div>
    </div>
  );
};

export default LaserGrid;
