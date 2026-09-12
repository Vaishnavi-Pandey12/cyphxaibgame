"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound2, advanceToRound, computeFlashlightX, playerColumn } from "@/lib/gameEngine";
import { Aircraft } from "@/lib/airplanes";
import { 
  Waves, 
  Eye, 
  Skull, 
  AlertTriangle, 
  Clock, 
  FastForward, 
  ShieldCheck, 
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Wind
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";

export default function Round2Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [roundStartedAt, setRoundStartedAt] = useState<number>(Date.now());
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [eliminationReason, setEliminationReason] = useState<string>("");

  // Submersion & Oxygen State
  const [isSubmerged, setIsSubmerged] = useState<boolean>(true); // start underwater safely
  const [oxygen, setOxygen] = useState<number>(10); // 10 seconds oxygen
  const [flashlightCol, setFlashlightCol] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);

  const myCol = useMemo(() => {
    return user ? playerColumn(user.uid) : 4;
  }, [user]);

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
      if (snap.val() === "round3") router.push("/rounds/round-3");
    });

    return () => {
      unsubAC();
      unsubStarted();
      unsubUser();
      unsubStatus();
    };
  }, [user, router]);

  // Handle elimination write
  const triggerElimination = async (reason: string) => {
    if (playerStatus !== "alive" || !user) return;
    setPlayerStatus("eliminated");
    setEliminationReason(reason);
    await update(ref(database), {
      [`players/${user.uid}/status`]: "eliminated",
      [`gameState/round2/eliminated/${user.uid}`]: true,
    });
  };

  // Main tick loop: Flashlight movement, Oxygen decay/refill, Hit test
  useEffect(() => {
    if (isDone || playerStatus !== "alive") return;

    const interval = setInterval(() => {
      // 1. Update Flashlight Col
      const currentFlashlight = computeFlashlightX(aircraftSnapshot, roundStartedAt);
      setFlashlightCol(currentFlashlight);

      // 2. Oxygen logic
      setOxygen((prevOx) => {
        if (isSubmerged) {
          const next = Math.max(0, prevOx - 0.25);
          if (next <= 0) {
            triggerElimination("Oxygen depleted. You suffocated underwater.");
          }
          return next;
        } else {
          // Surfaced: Refill oxygen quickly
          return Math.min(10, prevOx + 2);
        }
      });

      // 3. Flashlight hit detection if surfaced
      if (!isSubmerged && currentFlashlight === myCol) {
        triggerElimination("The Jack's searchlight caught you on the surface.");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isSubmerged, aircraftSnapshot, roundStartedAt, myCol, isDone, playerStatus]);

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
      await resolveRound2();
      setIsDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const handleNextRound = async () => {
    await advanceToRound("round3");
  };

  if (playerStatus === "eliminated") {
    return (
      <EliminationScreen
        title="YOU DIED"
        message={eliminationReason || "Eliminated in Fishing - Caught by searchlight or suffocated underwater."}
        roundName="ROUND 02 // FISHING - SURVIVE THE JACK"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <div className="text-teal-400 font-bold text-xs tracking-widest mb-1">ROUND 02</div>
          <h1 className="text-3xl font-black text-white">FISHING // SURVIVE THE JACK</h1>
        </div>

        {!isDone ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-black text-cyan-400 font-mono">
              <Clock className="w-6 h-6 text-cyan-500" />
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
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-black font-black rounded-lg transition-colors shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            NEXT ROUND <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Telemetry & Rules */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-4">
            <h2 className="text-teal-400 font-bold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> PROTOCOL RULES
            </h2>
            <p className="text-xs text-teal-200/70 mb-2 leading-relaxed">
              1. Stay underwater to hide from the searchlight.
            </p>
            <p className="text-xs text-teal-200/70 mb-2 leading-relaxed">
              2. Oxygen lasts 10 seconds max. Surface to breathe when the searchlight is far from your column ({myCol}).
            </p>
            <p className="text-xs text-teal-200/70 leading-relaxed">
              3. If you surface while the searchlight shines on your column, you are immediately terminated.
            </p>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-zinc-500 tracking-widest mb-2">TARGET TELEMETRY</h3>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>TRACKING: <span className="text-cyan-400 font-bold">{aircraftSnapshot[1]?.callsign || "SKYNET_02"}</span></div>
              <div>SPEED VECTOR: <span className="text-white font-mono">{aircraftSnapshot[1]?.speed || 450} kts</span></div>
              <div>SWEEP INTERVAL: <span className="text-teal-400 font-mono">5.0s</span></div>
              <div>ASSIGNED SECTOR: <span className="text-white font-bold">COL {myCol}</span></div>
            </div>
          </div>
        </div>

        {/* Lake View & Player Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* Lake Visual Grid (10 Columns) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
              <span>LAKE SECTORS (0 - 9)</span>
              <span className="text-teal-400 flex items-center gap-1">
                <Eye className="w-4 h-4 animate-pulse" /> SEARCHLIGHT AT COL {flashlightCol}
              </span>
            </div>

            {/* Surface Line with Searchlight */}
            <div className="grid grid-cols-10 gap-1 mb-2">
              {Array.from({ length: 10 }).map((_, col) => {
                const isBeam = col === flashlightCol;
                const isMe = col === myCol;
                return (
                  <div key={col} className="flex flex-col items-center">
                    <div
                      className={`w-full h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isBeam
                          ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.8)] border border-amber-300"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-600"
                      }`}
                    >
                      {col}
                    </div>
                    {/* Beam cone coming down */}
                    <div
                      className={`w-full h-24 transition-all opacity-70 ${
                        isBeam
                          ? "bg-gradient-to-b from-amber-400/40 via-amber-400/10 to-transparent"
                          : "bg-transparent"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Water Depth Container */}
            <div className="w-full h-44 rounded-xl bg-gradient-to-b from-cyan-950/60 to-blue-950/80 border border-cyan-800/40 relative flex flex-col justify-between p-4">
              {/* Surface Level */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 text-[10px] text-cyan-400 font-bold">
                <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> SURFACE</span>
                <span>{!isSubmerged ? "SURFACED (REFILLING O2)" : "EMPTY"}</span>
              </div>

              {/* Player Position Representation */}
              <div className="grid grid-cols-10 gap-1 h-full items-center">
                {Array.from({ length: 10 }).map((_, col) => {
                  const isMe = col === myCol;
                  if (!isMe) return <div key={col} />;
                  return (
                    <div
                      key={col}
                      className={`flex flex-col items-center transition-all duration-300 ${
                        !isSubmerged ? "-translate-y-8" : "translate-y-4"
                      }`}
                    >
                      <div className="px-2 py-1 bg-cyan-400 text-black font-black text-[10px] rounded shadow-[0_0_10px_rgba(0,240,255,0.6)]">
                        YOU
                      </div>
                      <span className="text-[9px] text-cyan-200 mt-0.5">
                        {!isSubmerged ? "UP" : "DEEP"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Underwater Bed Level */}
              <div className="flex items-center justify-between border-t border-cyan-500/20 pt-2 text-[10px] text-cyan-400/60 font-mono">
                <span>LAKE BED (SAFE FROM LIGHT)</span>
                <span>{isSubmerged ? "SUBMERGED (LOSING O2)" : ""}</span>
              </div>
            </div>

            {/* Oxygen Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Wind className="w-4 h-4" /> OXYGEN RESERVES
                </span>
                <span className={`font-mono ${oxygen < 3 ? "text-red-400 animate-ping" : "text-white"}`}>
                  {oxygen.toFixed(1)}s / 10.0s
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-200 ${
                    oxygen < 3
                      ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                      : "bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                  }`}
                  style={{ width: `${(oxygen / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Stance Controls */}
            <div className="mt-6 flex gap-4">
              <button
                disabled={isDone}
                onClick={() => setIsSubmerged(true)}
                className={`flex-1 py-4 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  isSubmerged
                    ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <ArrowDownCircle className="w-5 h-5" /> DIVE (GO UNDERWATER)
              </button>

              <button
                disabled={isDone}
                onClick={() => setIsSubmerged(false)}
                className={`flex-1 py-4 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  !isSubmerged
                    ? "bg-teal-950/40 border-teal-400 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <ArrowUpCircle className="w-5 h-5" /> SURFACE (COME OUT & BREATHE)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
