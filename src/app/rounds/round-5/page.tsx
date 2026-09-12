"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound5Iteration, resetToLobby } from "@/lib/gameEngine";
import {
  Trophy,
  AlertTriangle,
  Clock,
  FastForward,
  CheckCircle2,
  Brain,
  Layers,
  Plane,
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";
import { Header } from "@/components/theme/Header";
import { RulesModal } from "@/components/game/RulesModal";

export default function Round5Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [r5State, setR5State] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [players, setPlayers] = useState<Record<string, any>>({});

  // Local state — reset on each iteration
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState<number>(30);
  const [userGuesses, setUserGuesses] = useState<Record<string, number>>({});
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);
  const [showRules, setShowRules] = useState(true);

  // Track previous iteration to detect changes
  const prevIterationRef = useRef<number>(1);

  useEffect(() => {
    const unsubR5 = onValue(ref(database, "gameState/round5"), (snap) => {
      const val = snap.val();
      setR5State(val);

      if (!val) return;
      const newIteration: number = val.iteration || 1;

      // Detect iteration change → reset all local state
      if (newIteration !== prevIterationRef.current) {
        prevIterationRef.current = newIteration;
        setUserGuesses({});
        setHasSubmitted(false);
        setMemorizeTimeLeft(30);
      }
    });
    const unsubPlayers = onValue(ref(database, "players"), (snap) => {
      setPlayers(snap.val() || {});
    });
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        setPlayerStatus(snap.val() || "alive");
      });
    }
    return () => { unsubR5(); unsubPlayers(); unsubUser(); };
  }, [user]);

  const phase = r5State?.phase || "memorize";
  const sequence: any[] = r5State?.sequence || [];
  const shuffled: any[] = r5State?.shuffled || [];

  // Memorize countdown (runs per iteration + phase)
  useEffect(() => {
    if (phase !== "memorize" || showRules) return;

    setMemorizeTimeLeft(30);

    const timer = setInterval(() => {
      setMemorizeTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          update(ref(database), { "gameState/round5/phase": "recall" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // phase and iteration together trigger the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, r5State?.iteration, showRules]);

  const handleSkipMemorize = async () => {
    await update(ref(database), { "gameState/round5/phase": "recall" });
  };

  const handleSelectRank = (planeId: string, rank: number) => {
    if (hasSubmitted) return;
    setUserGuesses((prev) => ({ ...prev, [planeId]: rank }));
  };

  const handleSubmitRecall = async () => {
    if (!user || hasSubmitted) return;
    setHasSubmitted(true);
    await update(ref(database), {
      [`gameState/round5/answers/${user.uid}`]: userGuesses,
    });
  };

  const { survivorCount, isWinner } = useMemo(() => {
    const aliveList = Object.values(players).filter((p) => p.status === "alive");
    const winner = aliveList.length === 1 && aliveList[0].id === user?.uid;
    return { survivorCount: aliveList.length, isWinner: winner };
  }, [players, user]);

  const handleTriggerEvaluation = async () => {
    if (resolving) return;
    setResolving(true);
    try {
      await resolveRound5Iteration();
      // Local state reset happens via the Firebase listener detecting iteration change
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const amEliminated =
    playerStatus === "eliminated" || r5State?.eliminated?.[user?.uid || ""];

  if (amEliminated) {
    return (
      <EliminationScreen
        title="SEQUENCE FAILED"
        message="Your flight order recall was corrupted. You have been expunged in the final trial."
        roundName="FINAL TRIAL // DEJA VU [♥ HEARTS]"
        autoRedirectSeconds={5}
      />
    );
  }

  if (isWinner) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex flex-col items-center justify-center p-6 text-center font-mono relative overflow-hidden select-none">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,84,75,0.2)_0%,_transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-lg bg-[#131313] border-2 border-[#ff544b] p-8 shadow-[0_0_60px_rgba(255,84,75,0.6)]">
          <div className="p-5 bg-[#920703]/30 border-2 border-[#ff544b] rounded-2xl inline-block mb-6 shadow-[0_0_30px_rgba(255,84,75,0.5)]">
            <Trophy className="w-16 h-16 text-[#ff544b] animate-bounce" />
          </div>
          <h1 className="font-['Cinzel'] text-4xl sm:text-5xl font-black text-[#ffdad6] tracking-wider uppercase mb-2">
            VICTORY ACHIEVED
          </h1>
          <p className="text-xs font-bold text-[#ff544b] tracking-[0.25em] uppercase mb-6">
            SOLE SURVIVOR OF SKYNET BORDERLAND
          </p>
          <div className="p-4 bg-[#0e0e0e] border border-[#ff544b]/40 text-xs text-[#e9bcb7] mb-8 leading-relaxed font-sans">
            You conquered all 5 trials: Flight 404, Fishing, Redline, Rapid Fire, and Deja Vu. You alone have exfiltrated the Borderland.
          </div>
          <button
            onClick={async () => {
              await resetToLobby(user?.uid);
              router.push("/lobby");
            }}
            className="w-full py-4 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono font-black text-xs sm:text-sm tracking-[0.25em] uppercase transition-all shadow-[0_0_30px_rgba(255,84,75,0.6)] cursor-pointer"
          >
            RETURN TO LOBBY &amp; RESTART
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono flex flex-col justify-between select-none">
      {showRules && (
        <RulesModal roundIndex={4} onDismiss={() => setShowRules(false)} />
      )}
      <Header />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1c1b1b] p-5 border border-[#353534] shadow-xl">
          <div>
            <div className="text-[#ff544b] font-bold text-xs tracking-[0.25em] mb-1 flex items-center gap-1.5">
              <span>♥</span> <span>FINAL TRIAL // PSYCHOLOGICAL</span>
            </div>
            <h1 className="font-['Cinzel'] text-3xl font-black text-[#ffdad6] tracking-wider uppercase">
              DEJA VU // THE FINAL SURVIVOR
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 border border-[#ff544b]/40 bg-[#920703]/20 text-xs text-[#ffdad6] font-bold font-mono">
              SURVIVORS REMAINING: {survivorCount}
            </div>
            {phase === "memorize" && (
              <button
                onClick={handleSkipMemorize}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-xs font-bold text-[#ffb4ab] transition-colors cursor-pointer uppercase"
              >
                <FastForward className="w-3 h-3" /> SKIP ({memorizeTimeLeft}s)
              </button>
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#1c1b1b] border border-[#ff544b]/30 p-4 shadow-md">
              <h2 className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff544b]" /> PROTOCOL RULES
              </h2>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                1. <span className="text-white font-bold">MEMORIZE</span>: Observe the exact sequential order of the aircraft during the countdown.
              </p>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                2. <span className="text-white font-bold">RECALL</span>: The aircraft will shuffle. Assign each aircraft back to its original slot.
              </p>
              <p className="text-xs text-[#ff544b] leading-relaxed font-bold">
                3. Any mistake triggers immediate elimination. The trial repeats until ONLY 1 SURVIVOR remains.
              </p>
            </div>

            <div className="bg-[#1c1b1b] border border-[#353534] p-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#af8783] tracking-widest uppercase mb-2 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#ff544b]" /> TRIAL STATUS
              </h3>
              <div className="text-xs space-y-2 text-[#e5e2e1]">
                <div>
                  PHASE:{" "}
                  <span className="text-[#ffdad6] font-bold uppercase">{phase}</span>
                </div>
                <div>
                  CYCLE:{" "}
                  <span className="text-white font-mono">ITERATION #{r5State?.iteration || 1}</span>
                </div>
                <div>
                  AIRCRAFT ITEMS:{" "}
                  <span className="text-[#ff544b] font-bold">{sequence.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-[#1c1b1b] border border-[#353534] p-6 shadow-xl">
              {/* MEMORIZE PHASE */}
              {phase === "memorize" && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#353534] pb-4 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#ffb4ab] uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-[#ff544b]" /> MEMORIZE INITIAL FLIGHT POSITIONS
                    </div>
                    <div className="flex items-center gap-1 text-lg font-black text-[#ff544b] font-mono">
                      <Clock className="w-5 h-5 text-[#ff544b]" /> {memorizeTimeLeft}s
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {sequence.map((item: any, index: number) => (
                      <div
                        key={item.planeId || item.id || index}
                        className="p-4 bg-[#0e0e0e] border border-[#353534] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 bg-[#201f1f] text-[#ffdad6] border border-[#353534] font-black text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white text-base flex items-center gap-2">
                              <Plane className="w-4 h-4 text-[#ff544b]" /> {item.callsign}
                            </div>
                            <div className="text-xs text-[#af8783]">
                              ALT: {item.altitude} ft • SPD: {item.speed} kts
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-[#ff544b] font-mono font-bold">
                          POSITION #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-xs text-[#af8783]">
                    Cards will shuffle automatically when the countdown reaches 0s.
                  </p>
                </div>
              )}

              {/* RECALL PHASE */}
              {phase === "recall" && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#353534] pb-4 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#ffb4ab] uppercase tracking-wider">
                      <Brain className="w-4 h-4 text-[#ff544b]" /> RECONSTRUCT ORIGINAL ORDER
                    </div>
                    <span className="text-xs text-[#ff544b] font-bold">
                      {Object.keys(userGuesses).length} / {shuffled.length} SLOTS ASSIGNED
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    {shuffled.map((item: any) => {
                      const chosenRank = userGuesses[item.planeId || item.id];
                      return (
                        <div
                          key={item.planeId || item.id}
                          className="p-4 bg-[#0e0e0e] border border-[#353534] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-white text-base flex items-center gap-2">
                              <Plane className="w-4 h-4 text-[#ff544b]" /> {item.callsign}
                            </div>
                            <div className="text-xs text-[#af8783]">
                              ALT: {item.altitude} ft • SPD: {item.speed} kts
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#af8783] mr-2">WAS SLOT:</span>
                            {sequence.map((_: any, rIdx: number) => {
                              const rankNum = rIdx + 1;
                              const isSelected = chosenRank === rankNum;
                              return (
                                <button
                                  key={rankNum}
                                  disabled={hasSubmitted}
                                  onClick={() =>
                                    handleSelectRank(item.planeId || item.id, rankNum)
                                  }
                                  className={`w-8 h-8 rounded border font-bold text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#ff544b] border-white text-[#5c0005] font-black shadow-[0_0_10px_rgba(255,84,75,0.8)]"
                                      : "bg-[#201f1f] border-[#353534] text-[#af8783] hover:text-white hover:border-[#5f3f3b]"
                                  }`}
                                >
                                  {rankNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      disabled={hasSubmitted || Object.keys(userGuesses).length < shuffled.length}
                      onClick={handleSubmitRecall}
                      className="px-8 py-3.5 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono font-black uppercase text-xs sm:text-sm tracking-[0.2em] rounded disabled:opacity-30 disabled:bg-[#353534] disabled:text-[#af8783] transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      {hasSubmitted ? (
                        <><CheckCircle2 className="w-5 h-5" /> RECALL RECORDED</>
                      ) : (
                        "LOCK IN RECONSTRUCTED SEQUENCE"
                      )}
                    </button>

                    <button
                      disabled={resolving}
                      onClick={handleTriggerEvaluation}
                      className="px-6 py-3.5 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#ffdad6] border border-[#353534] font-mono font-bold uppercase text-xs tracking-wider transition-colors cursor-pointer"
                    >
                      {resolving ? "EVALUATING..." : "[ RESOLVE CYCLE ]"}
                    </button>
                  </div>
                </div>
              )}

              {phase === "done" && (
                <div className="text-center py-12">
                  <div className="text-emerald-400 font-bold text-xl mb-2 font-mono">FINAL TRIAL COMPLETE</div>
                  <div className="text-xs text-[#af8783]">The last survivor has been determined.</div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
