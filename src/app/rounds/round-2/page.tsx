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
  AlertTriangle, 
  Clock, 
  FastForward, 
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Wind
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";
import { Header } from "@/components/theme/Header";
import { RulesModal } from "@/components/game/RulesModal";

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
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);
  const [showRules, setShowRules] = useState(true);

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
      const currentFlashlight = computeFlashlightX(aircraftSnapshot, roundStartedAt);
      setFlashlightCol(currentFlashlight);

      setOxygen((prevOx) => {
        if (isSubmerged) {
          const next = Math.max(0, prevOx - 0.25);
          if (next <= 0) {
            triggerElimination("Oxygen depleted. You suffocated underwater.");
          }
          return next;
        } else {
          return Math.min(10, prevOx + 2);
        }
      });

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
        roundName="ROUND 02 // FISHING - SURVIVE THE JACK [♠ SPADES]"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono flex flex-col justify-between select-none">
      {showRules && (
        <RulesModal roundIndex={1} onDismiss={() => setShowRules(false)} />
      )}
      <Header />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1c1b1b] p-5 border border-[#353534] shadow-xl">
          <div>
            <div className="text-[#ff544b] font-bold text-xs tracking-[0.25em] mb-1 flex items-center gap-1.5">
              <span>♠</span> <span>TRIAL 02 // PHYSICAL & ENDURANCE</span>
            </div>
            <h1 className="font-['Cinzel'] text-3xl font-black text-[#ffdad6] tracking-wider uppercase">
              FISHING // SURVIVE THE JACK
            </h1>
          </div>

          {!isDone ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-2xl font-black text-[#ff544b] font-mono">
                <Clock className="w-6 h-6 text-[#ff544b]" />
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
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#1c1b1b] border border-[#ff544b]/30 p-4 shadow-md">
              <h2 className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff544b]" /> SONAR SEARCHLIGHT RULES
              </h2>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                1. Stay submerged to evade the sweeping spotlight.
              </p>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                2. Oxygen depletes in 10s. Surface when the searchlight leaves your column ({myCol}).
              </p>
              <p className="text-xs text-[#ff544b] leading-relaxed font-bold">
                3. Surfacing while the beam is on your column triggers immediate expulsion.
              </p>
            </div>

            <div className="bg-[#1c1b1b] border border-[#353534] p-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#af8783] tracking-widest uppercase mb-2">TELEMETRY LOCK</h3>
              <div className="text-xs space-y-1 text-[#e5e2e1]">
                <div>TRACKING: <span className="text-[#ffdad6] font-bold">{aircraftSnapshot[1]?.callsign || "SKYNET_02"}</span></div>
                <div>AIRSPEED: <span className="text-white font-mono">{aircraftSnapshot[1]?.speed || 450} kts</span></div>
                <div>ASSIGNED SECTOR: <span className="text-[#ff544b] font-bold">COLUMN {myCol}</span></div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#1c1b1b] border border-[#353534] p-6 relative overflow-hidden shadow-xl">
              <div className="text-xs text-[#af8783] font-bold uppercase tracking-wider mb-4 flex justify-between items-center">
                <span>LAKE SECTORS (0 - 9)</span>
                <span className="text-[#ff544b] flex items-center gap-1 font-bold">
                  <Eye className="w-4 h-4 animate-pulse" /> SEARCHLIGHT AT COL {flashlightCol}
                </span>
              </div>

              {/* Surface Line with Searchlight */}
              <div className="grid grid-cols-10 gap-1 mb-2">
                {Array.from({ length: 10 }).map((_, col) => {
                  const isBeam = col === flashlightCol;
                  return (
                    <div key={col} className="flex flex-col items-center">
                      <div
                        className={`w-full h-8 flex items-center justify-center text-[10px] font-mono font-bold transition-all border ${
                          isBeam
                            ? "bg-[#ff544b] text-[#5c0005] shadow-[0_0_15px_rgba(255,84,75,0.8)] border-white"
                            : "bg-[#0e0e0e] border-[#353534] text-[#5f3f3b]"
                        }`}
                      >
                        {col}
                      </div>
                      <div
                        className={`w-full h-20 transition-all ${
                          isBeam
                            ? "bg-gradient-to-b from-[#ff544b]/50 via-[#ff544b]/15 to-transparent"
                            : "bg-transparent"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Depth Container */}
              <div className="w-full h-40 bg-[#0e0e0e] border border-[#353534] relative flex flex-col justify-between p-4">
                <div className="flex items-center justify-between border-b border-[#353534] pb-2 text-[10px] text-[#ffb4ab] font-bold">
                  <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> SURFACE</span>
                  <span>{!isSubmerged ? "SURFACED (REFILLING O2)" : "SUBMERGED"}</span>
                </div>

                {/* Player representation */}
                <div className="grid grid-cols-10 gap-1 h-full items-center">
                  {Array.from({ length: 10 }).map((_, col) => {
                    const isMe = col === myCol;
                    if (!isMe) return <div key={col} />;
                    return (
                      <div
                        key={col}
                        className={`flex flex-col items-center transition-all duration-300 ${
                          !isSubmerged ? "-translate-y-6" : "translate-y-3"
                        }`}
                      >
                        <div className="px-2 py-1 bg-[#ff544b] text-[#5c0005] font-black text-[10px] rounded shadow-[0_0_10px_rgba(255,84,75,0.7)]">
                          YOU
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-[#353534] pt-2 text-[10px] text-[#af8783] font-mono">
                  <span>LAKE DEPTH (SONAR SHIELD)</span>
                  <span>{isSubmerged ? "HIDDEN (O2 DRAINING)" : "EXPOSED"}</span>
                </div>
              </div>

              {/* Oxygen Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-[#ffb4ab]">
                    <Wind className="w-4 h-4" /> OXYGEN RESERVES
                  </span>
                  <span className={`font-mono ${oxygen < 3 ? "text-[#ff544b] animate-ping" : "text-white"}`}>
                    {oxygen.toFixed(1)}s / 10.0s
                  </span>
                </div>
                <div className="w-full bg-[#0e0e0e] h-2.5 overflow-hidden border border-[#353534]">
                  <div
                    className={`h-full transition-all duration-200 ${
                      oxygen < 3
                        ? "bg-[#93000a] shadow-[0_0_10px_rgba(255,84,75,0.8)]"
                        : "bg-[#ff544b] shadow-[0_0_10px_rgba(255,84,75,0.5)]"
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
                  className={`flex-1 py-4 border-2 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSubmerged
                      ? "bg-[#2a2a2a] border-[#ff544b] text-[#ffdad6] shadow-[0_0_15px_rgba(255,84,75,0.3)]"
                      : "bg-[#0e0e0e] border-[#353534] text-[#af8783] hover:border-[#5f3f3b]"
                  }`}
                >
                  <ArrowDownCircle className="w-5 h-5" /> DIVE (GO UNDERWATER)
                </button>

                <button
                  disabled={isDone}
                  onClick={() => setIsSubmerged(false)}
                  className={`flex-1 py-4 border-2 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isSubmerged
                      ? "bg-[#920703] border-[#ff544b] text-white shadow-[0_0_15px_rgba(255,84,75,0.5)]"
                      : "bg-[#0e0e0e] border-[#353534] text-[#af8783] hover:border-[#5f3f3b]"
                  }`}
                >
                  <ArrowUpCircle className="w-5 h-5" /> SURFACE (COME UP & BREATHE)
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
