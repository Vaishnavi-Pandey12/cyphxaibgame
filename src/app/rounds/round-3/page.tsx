"use client";

import React, { useEffect, useState, useCallback } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound3, advanceToRound, computeActiveLaserCols, deductLife } from "@/lib/gameEngine";
import { Aircraft } from "@/lib/airplanes";
import {
  Zap,
  AlertTriangle,
  Clock,
  FastForward,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Heart,
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";
import { Header } from "@/components/theme/Header";
import { RulesModal } from "@/components/game/RulesModal";

export default function Round3Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [roundStartedAt, setRoundStartedAt] = useState<number>(Date.now());
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [eliminationReason, setEliminationReason] = useState<string>("");

  // Player lives
  const [lives, setLives] = useState<number>(3);
  const [hitCooldown, setHitCooldown] = useState<boolean>(false);

  // 10x10 Grid Player Position
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 5, c: 5 });
  const [activeLaserCols, setActiveLaserCols] = useState<number[]>([]);
  const [isWarning, setIsWarning] = useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    const unsubAC = onValue(ref(database, "gameState/aircraftSnapshot"), (snap) => {
      if (snap.val()) setAircraftSnapshot(snap.val());
    });
    const unsubStarted = onValue(ref(database, "gameState/roundStartedAt"), (snap) => {
      if (snap.val()) setRoundStartedAt(snap.val());
    });
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}`), (snap) => {
        const p = snap.val();
        if (!p) return;
        setPlayerStatus(p.status || "alive");
        setLives(p.lives ?? 3);
      });
    }
    const unsubStatus = onValue(ref(database, "gameState/status"), (snap) => {
      if (snap.val() === "round4") router.push("/rounds/round-4");
    });
    return () => { unsubAC(); unsubStarted(); unsubUser(); unsubStatus(); };
  }, [user, router]);

  const triggerElimination = useCallback(async (reason: string) => {
    if (playerStatus !== "alive" || !user) return;
    setPlayerStatus("eliminated");
    setEliminationReason(reason);
    await update(ref(database), {
      [`players/${user.uid}/status`]: "eliminated",
      [`gameState/round3/eliminated/${user.uid}`]: true,
    });
  }, [playerStatus, user]);

  const handleLaserHit = useCallback(async () => {
    if (!user || hitCooldown || playerStatus !== "alive") return;
    setHitCooldown(true);
    setTimeout(() => setHitCooldown(false), 1500);

    const newLives = await deductLife(user.uid);
    if (newLives <= 0) {
      setPlayerStatus("eliminated");
      setEliminationReason("You were incinerated by a synchronized Redline laser. All lives lost.");
    }
  }, [user, hitCooldown, playerStatus]);

  useEffect(() => {
    if (isDone || playerStatus !== "alive") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const cycleMs = (now - roundStartedAt) % 2000;
      const cols = computeActiveLaserCols(aircraftSnapshot, roundStartedAt);
      setActiveLaserCols(cols);

      if (cycleMs < 600) {
        setIsWarning(true);
      } else {
        setIsWarning(false);
        if (cols.includes(playerPos.c)) {
          handleLaserHit();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isDone, playerStatus, aircraftSnapshot, roundStartedAt, playerPos, handleLaserHit]);

  const move = useCallback((dr: number, dc: number) => {
    if (playerStatus !== "alive" || isDone) return;
    setPlayerPos((prev) => ({
      r: Math.max(0, Math.min(9, prev.r + dr)),
      c: Math.max(0, Math.min(9, prev.c + dc)),
    }));
  }, [playerStatus, isDone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) move(-1, 0);
      else if (["ArrowDown", "KeyS"].includes(e.code)) move(1, 0);
      else if (["ArrowLeft", "KeyA"].includes(e.code)) move(0, -1);
      else if (["ArrowRight", "KeyD"].includes(e.code)) move(0, 1);
      else if (e.code === "Space") move(-2, 0);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  useEffect(() => {
    if (isDone || showRules) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, showRules]);

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
        message={eliminationReason || "Eliminated in Redline - All lives lost to laser fire."}
        roundName="ROUND 03 // REDLINE [♠ SPADES]"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono flex flex-col justify-between select-none">
      {showRules && (
        <RulesModal roundIndex={2} onDismiss={() => setShowRules(false)} />
      )}
      <Header />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1c1b1b] p-5 border border-[#353534] shadow-xl">
          <div>
            <div className="text-[#ff544b] font-bold text-xs tracking-[0.25em] mb-1 flex items-center gap-1.5">
              <span>♠</span> <span>TRIAL 03 // HEART-RATE &amp; STAMINA</span>
            </div>
            <h1 className="font-['Cinzel'] text-3xl font-black text-[#ffdad6] tracking-wider uppercase">
              REDLINE // LASER GRID
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Lives display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#353534] bg-[#1c1b1b]">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-5 h-5 transition-all ${
                    i < lives
                      ? "text-[#ff544b] fill-[#ff544b]"
                      : "text-[#353534] fill-[#353534]"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-[#ffb4ab] ml-1">{lives} LIVES</span>
            </div>

            {!isDone ? (
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 text-2xl font-black font-mono ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-[#ff544b]"}`}>
                  <Clock className="w-6 h-6" />
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </div>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-xs font-bold text-[#ffb4ab] transition-colors cursor-pointer uppercase"
                >
                  <FastForward className="w-3 h-3" /> SKIP
                </button>
              </div>
            ) : (
              <button
                onClick={handleNextRound}
                className="flex items-center gap-2 px-6 py-3 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-black text-xs uppercase tracking-widest rounded transition-colors cursor-pointer shadow-[0_0_20px_rgba(255,84,75,0.4)]"
              >
                NEXT ROUND <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            {/* Rules / Hint Layer — persistent */}
            <div className="bg-[#1c1b1b] border border-[#ff544b]/30 p-4 shadow-md">
              <h2 className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff544b]" /> LASER PROTOCOL RULES
              </h2>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                3 vertical columns fire synchronously based on aircraft transponder heading.
              </p>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                Use <span className="text-white font-bold">WASD</span> or{" "}
                <span className="text-white font-bold">Arrow Keys</span>. Press{" "}
                <span className="text-white font-bold">SPACE</span> to Jump 2 rows.
              </p>
              <p className="text-xs text-[#ff544b] leading-relaxed font-bold">
                Amber = Charging warning. Red = Lethal discharge. Each hit costs 1 life.
              </p>
            </div>

            {/* Active laser info hint layer */}
            <div className="bg-[#1c1b1b] border border-[#353534] p-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#af8783] tracking-widest uppercase mb-2 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#ff544b]" /> ACTIVE LASER INTEL
              </h3>
              <div className="text-xs space-y-1.5 text-[#e5e2e1]">
                <div className="flex items-center justify-between">
                  <span className="text-[#af8783]">TARGET:</span>
                  <span className="text-[#ffdad6] font-bold">{aircraftSnapshot[2]?.callsign || "SKYLINK_3"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#af8783]">BEARING:</span>
                  <span className="text-white font-mono">{aircraftSnapshot[2]?.track || 210}°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#af8783]">LASER COLS:</span>
                  <span className="text-[#ff544b] font-mono font-bold">
                    {activeLaserCols.length > 0 ? activeLaserCols.join(", ") : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#af8783]">YOUR POS:</span>
                  <span className="text-[#ffdad6] font-bold">[{playerPos.r}, {playerPos.c}]</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#af8783]">STATUS:</span>
                  <span className={`font-bold ${isWarning ? "text-yellow-400 animate-pulse" : activeLaserCols.includes(playerPos.c) ? "text-red-400" : "text-emerald-400"}`}>
                    {isWarning ? "⚠ CHARGING" : activeLaserCols.includes(playerPos.c) ? "⚡ DANGER" : "✓ SAFE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Directional Pad */}
            <div className="bg-[#1c1b1b] border border-[#353534] p-4 flex flex-col items-center gap-2 shadow-sm">
              <div className="text-[10px] text-[#af8783] font-bold uppercase tracking-wider mb-1">TACTICAL CONTROLS</div>
              <button
                onClick={() => move(-1, 0)}
                className="w-11 h-11 bg-[#201f1f] border border-[#353534] text-[#ffdad6] flex items-center justify-center hover:bg-[#ff544b] hover:text-[#5c0005] transition-all cursor-pointer"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => move(0, -1)}
                  className="w-11 h-11 bg-[#201f1f] border border-[#353534] text-[#ffdad6] flex items-center justify-center hover:bg-[#ff544b] hover:text-[#5c0005] transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => move(1, 0)}
                  className="w-11 h-11 bg-[#201f1f] border border-[#353534] text-[#ffdad6] flex items-center justify-center hover:bg-[#ff544b] hover:text-[#5c0005] transition-all cursor-pointer"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => move(0, 1)}
                  className="w-11 h-11 bg-[#201f1f] border border-[#353534] text-[#ffdad6] flex items-center justify-center hover:bg-[#ff544b] hover:text-[#5c0005] transition-all cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => move(-2, 0)}
                className="w-full mt-1 py-2 bg-[#201f1f] border border-[#353534] text-[10px] font-bold uppercase tracking-wider hover:bg-[#ff544b] hover:text-[#5c0005] cursor-pointer"
              >
                [ SPACE ] LEAP 2 ROWS
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-[#1c1b1b] border border-[#353534] p-6 flex flex-col items-center shadow-xl">
              {/* Column Indicators */}
              <div className="grid grid-cols-10 gap-1 w-full max-w-[440px] mb-1">
                {Array.from({ length: 10 }).map((_, c) => {
                  const isActive = activeLaserCols.includes(c);
                  return (
                    <div
                      key={c}
                      className={`h-5 text-[9px] font-mono font-bold flex items-center justify-center transition-all border ${
                        isActive
                          ? isWarning
                            ? "bg-[#ffb4ab] text-black shadow-[0_0_8px_rgba(255,180,171,0.8)] border-white"
                            : "bg-[#ff544b] text-[#5c0005] shadow-[0_0_12px_rgba(255,84,75,1)] border-white"
                          : "text-[#af8783] bg-[#0e0e0e] border-[#353534]"
                      }`}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>

              {/* 10x10 Matrix Grid */}
              <div className="grid grid-cols-10 gap-1 w-full max-w-[440px] aspect-square p-2 bg-[#0e0e0e] border border-[#353534]">
                {Array.from({ length: 100 }).map((_, idx) => {
                  const r = Math.floor(idx / 10);
                  const c = idx % 10;
                  const isPlayer = playerPos.r === r && playerPos.c === c;
                  const isLaserCol = activeLaserCols.includes(c);

                  let cellStyle = "bg-[#131313] border-[#201f1f]";
                  if (isLaserCol) {
                    if (isWarning) {
                      cellStyle = "bg-[#ffb4ab]/20 border-[#ffb4ab]/40 animate-pulse";
                    } else {
                      cellStyle = "bg-[#ff544b]/45 border-[#ff544b] shadow-[inset_0_0_10px_rgba(255,84,75,0.8)]";
                    }
                  }
                  if (isPlayer) {
                    cellStyle = "bg-[#ff544b] border-white shadow-[0_0_15px_rgba(255,84,75,1)] font-black text-xs text-[#5c0005]";
                  }

                  return (
                    <div
                      key={idx}
                      className={`rounded-sm border flex items-center justify-center font-mono transition-colors ${cellStyle}`}
                    >
                      {isPlayer ? "P" : isLaserCol && !isWarning ? <Zap className="w-3 h-3 text-[#ffdad6]" /> : null}
                    </div>
                  );
                })}
              </div>

              <div className="w-full max-w-[440px] mt-4 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#ffb4ab] border border-white" />
                  <span className="text-[#af8783]">WARNING</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#ff544b] border border-white" />
                  <span className="text-[#ff544b] font-bold">LETHAL FIRE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#ff544b] text-[#5c0005] font-bold flex items-center justify-center text-[8px]">P</span>
                  <span className="text-[#ffdad6]">YOU</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
