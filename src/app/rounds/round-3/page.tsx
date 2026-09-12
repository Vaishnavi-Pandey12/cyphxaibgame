"use client";

import React, { useEffect, useState, useCallback } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound3, advanceToRound, computeActiveLaserCols } from "@/lib/gameEngine";
import { Aircraft } from "@/lib/airplanes";
import { 
  Zap, 
  Skull, 
  AlertTriangle, 
  Clock, 
  FastForward, 
  ChevronRight,
  Crosshair,
  Compass
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";

export default function Round3Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [roundStartedAt, setRoundStartedAt] = useState<number>(Date.now());
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [eliminationReason, setEliminationReason] = useState<string>("");

  // Player position in 10x10 grid: row (0-9), col (0-9)
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 9, c: 5 });
  const [activeLaserCols, setActiveLaserCols] = useState<number[]>([]);
  const [isWarning, setIsWarning] = useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);

  // Subscribe to Firebase state
  useEffect(() => {
    const unsubAC = onValue(ref(database, "gameState/aircraftSnapshot"), (snap) => {
      if (snap.val()) setAircraftSnapshot(snap.val());
    });
    const unsubStarted = onValue(ref(database, "gameState/roundStartedAt"), (snap) => {
      if (snap.val()) setRoundStartedAt(snap.val());
    });
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        const s = snap.val() || "alive";
        setPlayerStatus(s);
      });
    }
    const unsubStatus = onValue(ref(database, "gameState/status"), (snap) => {
      if (snap.val() === "round4") router.push("/rounds/round-4");
    });

    return () => {
      unsubAC();
      unsubStarted();
      unsubUser();
      unsubStatus();
    };
  }, [user, router]);

  // Handle elimination write
  const triggerElimination = useCallback(async (reason: string) => {
    if (playerStatus !== "alive" || !user) return;
    setPlayerStatus("eliminated");
    setEliminationReason(reason);
    await update(ref(database), {
      [`players/${user.uid}/status`]: "eliminated",
      [`gameState/round3/eliminated/${user.uid}`]: true,
    });
  }, [playerStatus, user]);

  // Laser cycle & collision check
  useEffect(() => {
    if (isDone || playerStatus !== "alive") return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartedAt;
      const subCycle = (elapsed % 2000); // 2000ms loop

      const cols = computeActiveLaserCols(aircraftSnapshot, roundStartedAt);
      setActiveLaserCols(cols);

      // Warning for first 500ms of each cycle, active lethal beam for next 1500ms
      if (subCycle < 500) {
        setIsWarning(true);
      } else {
        setIsWarning(false);
        // Lethal phase: Check if player column matches active laser
        if (cols.includes(playerPos.c)) {
          triggerElimination(`Intercepted by active laser beam on column ${playerPos.c}.`);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isDone, playerStatus, roundStartedAt, aircraftSnapshot, playerPos, triggerElimination]);

  // Keyboard controls
  useEffect(() => {
    if (isDone || playerStatus !== "alive") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      setPlayerPos((prev) => {
        let { r, c } = prev;

        if (key === "w" || key === "arrowup") {
          r = Math.max(0, r - 1);
        } else if (key === "s" || key === "arrowdown") {
          r = Math.min(9, r + 1);
        } else if (key === "a" || key === "arrowleft") {
          c = Math.max(0, c - 1);
        } else if (key === "d" || key === "arrowright") {
          c = Math.min(9, c + 1);
        } else if (key === " " || key === "space") {
          // Jump 2 rows forward (upward) or bound check
          r = Math.max(0, r - 2);
        }

        return { r, c };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDone, playerStatus]);

  // Round countdown timer
  useEffect(() => {
    if (isDone) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleResolve();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDone]);

  const handleResolve = async () => {
    if (resolving || isDone) return;
    setResolving(true);
    try {
      await resolveRound3();
      setIsDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const handleNextRound = async () => {
    await advanceToRound("round4");
  };

  if (playerStatus === "eliminated") {
    return (
      <EliminationScreen
        title="YOU DIED"
        message={eliminationReason || "Vaporized by Redline active laser matrix."}
        roundName="ROUND 03 // REDLINE - LASER GRID"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <div className="text-red-500 font-bold text-xs tracking-widest mb-1">ROUND 03</div>
          <h1 className="text-3xl font-black text-white">REDLINE // LASER GRID</h1>
        </div>

        {!isDone ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-black text-red-400 font-mono">
              <Clock className="w-6 h-6 text-red-500" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </div>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-bold text-white transition-colors"
            >
              <FastForward className="w-3 h-3" /> SKIP
            </button>
          </div>
        ) : (
          <button
            onClick={handleNextRound}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            NEXT ROUND <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rules & Telemetry */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
            <h2 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> LASER PROTOCOL
            </h2>
            <p className="text-xs text-red-200/70 mb-2 leading-relaxed">
              Lasers fire vertically along 3 columns synced to aircraft track headings.
            </p>
            <p className="text-xs text-red-200/70 mb-2 leading-relaxed">
              Use <span className="text-white font-bold">WASD</span> or <span className="text-white font-bold">Arrow Keys</span> to navigate. Press <span className="text-white font-bold">SPACE</span> to Jump 2 rows.
            </p>
            <p className="text-xs text-red-200/70 leading-relaxed">
              Yellow = Warning. Red = Lethal discharge.
            </p>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-zinc-500 tracking-widest mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-red-400" /> FLIGHT VECTORS
            </h3>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>TARGET: <span className="text-cyan-400 font-bold">{aircraftSnapshot[2]?.callsign || "SKYLINK_3"}</span></div>
              <div>BEARING TRACK: <span className="text-white font-mono">{aircraftSnapshot[2]?.track || 210}°</span></div>
              <div>LASER COLUMNS: <span className="text-red-400 font-mono">{activeLaserCols.join(", ")}</span></div>
              <div>YOUR COORDINATES: <span className="text-cyan-400 font-bold">[{playerPos.r}, {playerPos.c}]</span></div>
            </div>
          </div>
        </div>

        {/* 10x10 Laser Matrix */}
        <div className="md:col-span-2">
          <div className="bg-black border border-zinc-800 rounded-2xl p-4 flex flex-col items-center">
            {/* Column Indicators */}
            <div className="grid grid-cols-10 gap-1 w-full max-w-[440px] mb-1">
              {Array.from({ length: 10 }).map((_, c) => {
                const isActive = activeLaserCols.includes(c);
                return (
                  <div
                    key={c}
                    className={`h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all ${
                      isActive
                        ? isWarning
                          ? "bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                          : "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,1)]"
                        : "text-zinc-600"
                    }`}
                  >
                    {isActive ? <Zap className="w-3 h-3" /> : c}
                  </div>
                );
              })}
            </div>

            {/* 10x10 Matrix */}
            <div className="grid grid-rows-10 gap-1 w-full max-w-[440px] aspect-square bg-zinc-950 p-2 rounded-xl border border-zinc-900">
              {Array.from({ length: 10 }).map((_, r) => (
                <div key={r} className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }).map((_, c) => {
                    const isPlayerHere = playerPos.r === r && playerPos.c === c;
                    const isLaserColumn = activeLaserCols.includes(c);

                    let cellStyle = "bg-zinc-900/60 border border-zinc-800/80";

                    if (isLaserColumn) {
                      if (isWarning) {
                        cellStyle = "bg-amber-500/20 border border-amber-500/40";
                      } else {
                        cellStyle = "bg-red-600/40 border border-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.6)]";
                      }
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] relative transition-all ${cellStyle}`}
                      >
                        {isPlayerHere && (
                          <div className="w-3/4 h-3/4 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,1)] border-2 border-white flex items-center justify-center animate-pulse">
                            <span className="text-[7px] text-black font-black">P</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Controls On-screen reminder */}
            <div className="flex items-center gap-4 mt-4 text-zinc-500 text-[11px]">
              <span className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-cyan-400" /> WASD / ARROWS to Move</span>
              <span>•</span>
              <span className="text-zinc-400 font-bold">SPACE to Jump</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
