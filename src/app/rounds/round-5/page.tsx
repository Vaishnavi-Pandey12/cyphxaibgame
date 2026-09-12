"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound5Iteration, R5Item, resetToLobby } from "@/lib/gameEngine";
import { 
  Trophy, 
  Skull, 
  AlertTriangle, 
  Clock, 
  FastForward, 
  CheckCircle2, 
  Brain, 
  Shuffle, 
  RotateCcw,
  Sparkles,
  Plane
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";

export default function Round5Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [r5State, setR5State] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [survivorCount, setSurvivorCount] = useState<number>(0);

  // Local phase: "memorize" (30s) or "recall" (player entering numbers)
  const [phase, setPhase] = useState<"memorize" | "recall" | "evaluating">("memorize");
  const [countdown, setCountdown] = useState<number>(30);

  // Player answers: planeId -> entered number
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);
  const [isWinner, setIsWinner] = useState<boolean>(false);

  // Subscribe to Firebase state
  useEffect(() => {
    const unsubR5 = onValue(ref(database, "gameState/round5"), (snap) => {
      const data = snap.val();
      setR5State(data);
      if (data?.phase === "done") {
        setIsWinner(true);
      }
    });

    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        setPlayerStatus(snap.val() || "alive");
      });
    }

    const unsubPlayers = onValue(ref(database, "players"), (snap) => {
      const all = snap.val() || {};
      const alive = Object.values(all).filter((p: any) => p.status === "alive");
      setSurvivorCount(alive.length);
    });

    return () => {
      unsubR5();
      unsubUser();
      unsubPlayers();
    };
  }, [user]);

  // Memorization 30-second timer
  useEffect(() => {
    if (phase !== "memorize") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("recall");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const sequence: R5Item[] = useMemo(() => {
    return r5State?.sequence || [];
  }, [r5State]);

  const shuffled: R5Item[] = useMemo(() => {
    return r5State?.shuffled || [];
  }, [r5State]);

  const handleSkipMemorize = () => {
    setPhase("recall");
    setCountdown(0);
  };

  const handleInputChange = (planeId: string, val: string) => {
    setInputs((prev) => ({ ...prev, [planeId]: val }));
  };

  const handleSubmitAnswers = async () => {
    if (!user || isSubmitted || playerStatus !== "alive") return;
    setIsSubmitted(true);
    setPhase("evaluating");

    // Convert string inputs to numbers
    const parsed: Record<string, number> = {};
    Object.entries(inputs).forEach(([pid, v]) => {
      parsed[pid] = parseInt(v, 10);
    });

    await update(ref(database), {
      [`gameState/round5/answers/${user.uid}`]: parsed,
    });

    // Trigger evaluation
    handleResolve();
  };

  const handleResolve = async () => {
    if (resolving) return;
    setResolving(true);
    try {
      const res = await resolveRound5Iteration();
      if (!res.done) {
        // Reset local state for next iteration
        setInputs({});
        setIsSubmitted(false);
        setPhase("memorize");
        setCountdown(30);
      } else {
        if (res.survivors.includes(user?.uid || "")) {
          setIsWinner(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const amEliminated = playerStatus === "eliminated" || r5State?.eliminated?.[user?.uid || ""];

  if (amEliminated) {
    return (
      <EliminationScreen
        title="SEQUENCE FAILED"
        message="Your flight order recall was corrupted. You have been erased in the final trial."
        roundName="FINAL TRIAL // DEJA VU"
        autoRedirectSeconds={5}
      />
    );
  }

  if (isWinner) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center font-mono relative overflow-hidden">
        <div className="fixed inset-0 bg-radial-vignette pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <div className="p-5 bg-yellow-500/10 border-2 border-yellow-400 rounded-3xl inline-block mb-6 shadow-[0_0_50px_rgba(250,204,21,0.3)]">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-amber-500 mb-3">
            VICTORY ACHIEVED
          </h1>
          <p className="text-sm font-bold text-yellow-300 tracking-widest uppercase mb-6">
            SOLE SURVIVOR OF SKYNET:BORDERLAND
          </p>
          <div className="p-4 rounded-xl bg-black border border-yellow-500/30 text-xs text-zinc-400 mb-8 leading-relaxed">
            You conquered all 5 trials: Flight 404, Fishing, Redline, Same Page, and Deja Vu. You are the ultimate survivor.
          </div>
          <button
            onClick={async () => {
              await resetToLobby(user?.uid);
              router.push("/lobby");
            }}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)]"
          >
            RETURN TO LOBBY & START AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <div className="text-yellow-400 font-bold text-xs tracking-widest mb-1">FINAL TRIAL // ROUND 05</div>
          <h1 className="text-3xl font-black text-white">DEJA VU // SAME MOMENT. DIFFERENT TRUTH</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-950/20 text-xs text-yellow-400 font-bold">
            SURVIVORS: {survivorCount}
          </div>
          {phase === "memorize" && (
            <button
              onClick={handleSkipMemorize}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-bold text-white transition-colors"
            >
              <FastForward className="w-3 h-3" /> SKIP (30s)
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rules */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-4">
            <h2 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" /> TRIAL RULES
            </h2>
            <p className="text-xs text-yellow-200/70 mb-2 leading-relaxed">
              1. Memorize the exact flight sequence displayed during the 30-second countdown.
            </p>
            <p className="text-xs text-yellow-200/70 mb-2 leading-relaxed">
              2. When shuffled, type the original position number (1, 2, 3...) beside each flight callsign.
            </p>
            <p className="text-xs text-yellow-200/70 leading-relaxed font-bold">
              3. Any mistake results in immediate deletion. Survives until only 1 player remains!
            </p>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-xs space-y-1">
            <div className="text-zinc-500 font-bold tracking-widest mb-1">ITERATION STATUS</div>
            <div>CYCLE: <span className="text-yellow-400 font-bold">#{r5State?.iteration || 1}</span></div>
            <div>STATUS: <span className="text-white font-mono uppercase">{phase}</span></div>
          </div>
        </div>

        {/* Game Phase Content */}
        <div className="md:col-span-2">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            {phase === "memorize" ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4" /> MEMORIZE CHRONOLOGY ({countdown}s)
                  </div>
                  <div className="text-xs text-zinc-500">Memorize the positions!</div>
                </div>

                <div className="space-y-3 mb-6">
                  {sequence.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl border border-yellow-500/30 bg-black/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-yellow-400 text-black font-black text-sm flex items-center justify-center">
                          {item.position}
                        </span>
                        <div>
                          <div className="font-black text-white text-base flex items-center gap-2">
                            <Plane className="w-4 h-4 text-yellow-400" /> {item.callsign}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">ID: {item.id}</div>
                        </div>
                      </div>
                      <span className="text-xs text-yellow-400/80 font-mono font-bold">POSITION #{item.position}</span>
                    </div>
                  ))}
                </div>

                <p className="text-center text-xs text-zinc-500 animate-pulse">
                  Shuffle sequence begins in {countdown} seconds...
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    <Shuffle className="w-4 h-4" /> ENTER ORIGINAL POSITIONS
                  </div>
                  <div className="text-xs text-zinc-500">Type 1, 2, 3...</div>
                </div>

                <div className="space-y-3 mb-6">
                  {shuffled.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl border border-zinc-800 bg-black/60 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Plane className="w-5 h-5 text-cyan-400" />
                        <div>
                          <div className="font-black text-white text-sm">{item.callsign}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">ID: {item.id}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">ORIGINAL POS:</span>
                        <input
                          type="number"
                          min={1}
                          max={sequence.length}
                          disabled={isSubmitted}
                          value={inputs[item.id] || ""}
                          onChange={(e) => handleInputChange(item.id, e.target.value)}
                          placeholder="?"
                          className="w-16 p-2 rounded-lg bg-zinc-900 border-2 border-zinc-700 text-center text-white font-black text-base focus:border-yellow-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    disabled={isSubmitted || Object.keys(inputs).length < shuffled.length}
                    onClick={handleSubmitAnswers}
                    className="px-8 py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center gap-2"
                  >
                    {isSubmitted ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> VERIFYING CHRONOLOGY...
                      </>
                    ) : (
                      "SUBMIT SEQUENCE"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
