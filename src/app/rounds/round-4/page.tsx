"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound4, advanceToRound } from "@/lib/gameEngine";
import { Aircraft } from "@/lib/airplanes";
import { 
  Users, 
  Skull, 
  AlertTriangle, 
  Clock, 
  FastForward, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck,
  HelpCircle
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";

export default function Round4Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [r4State, setR4State] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [resolving, setResolving] = useState<boolean>(false);

  // Subscribe to Firebase state
  useEffect(() => {
    const unsubAC = onValue(ref(database, "gameState/aircraftSnapshot"), (snap) => {
      if (snap.val()) setAircraftSnapshot(snap.val());
    });
    const unsubR4 = onValue(ref(database, "gameState/round4"), (snap) => {
      setR4State(snap.val());
    });
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        setPlayerStatus(snap.val() || "alive");
      });
    }
    const unsubStatus = onValue(ref(database, "gameState/status"), (snap) => {
      if (snap.val() === "round5") router.push("/rounds/round-5");
    });

    return () => {
      unsubAC();
      unsubR4();
      unsubUser();
      unsubStatus();
    };
  }, [user, router]);

  // Find player's team and question
  const { myTeamId, myTeamMembers, myQuestion } = useMemo(() => {
    if (!r4State?.teams || !user) {
      return { myTeamId: null, myTeamMembers: [], myQuestion: null };
    }

    let foundTeam: string | null = null;
    let members: string[] = [];

    for (const [teamId, uids] of Object.entries(r4State.teams as Record<string, string[]>)) {
      if (uids.includes(user.uid)) {
        foundTeam = teamId;
        members = uids;
        break;
      }
    }

    const q = foundTeam && r4State.questions ? r4State.questions[foundTeam] : null;

    return { myTeamId: foundTeam, myTeamMembers: members, myQuestion: q };
  }, [r4State, user]);

  // Round countdown timer
  useEffect(() => {
    if (r4State?.phase === "revealed") return;

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
  }, [r4State?.phase]);

  const handleLockIn = async () => {
    if (!user || selectedOption === null || isLocked || playerStatus !== "alive") return;
    setIsLocked(true);
    await update(ref(database), {
      [`gameState/round4/answers/${user.uid}`]: selectedOption,
    });
  };

  const handleResolve = async () => {
    if (resolving || r4State?.phase === "revealed") return;
    setResolving(true);
    try {
      await resolveRound4();
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const handleNextRound = async () => {
    await advanceToRound("round5");
  };

  const isRevealed = r4State?.phase === "revealed";
  const amEliminated = playerStatus === "eliminated" || r4State?.eliminated?.[user?.uid || ""];

  if (amEliminated) {
    return (
      <EliminationScreen
        title="TEAM TERMINATED"
        message="Your squad failed both survival conditions: No member guessed the correct bracket, and there was no unanimous consensus."
        roundName="ROUND 04 // SAME PAGE - DIFFERENT PERSPECTIVES"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <div className="text-fuchsia-400 font-bold text-xs tracking-widest mb-1">ROUND 04</div>
          <h1 className="text-3xl font-black text-white">SAME PAGE // DIFFERENT PERSPECTIVES</h1>
        </div>

        {!isRevealed ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-black text-fuchsia-400 font-mono">
              <Clock className="w-6 h-6 text-fuchsia-500" />
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
            className="flex items-center gap-2 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-lg transition-colors shadow-[0_0_20px_rgba(217,70,239,0.4)]"
          >
            NEXT ROUND <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rules & Team Roster */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-xl p-4">
            <h2 className="text-fuchsia-400 font-bold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> DUAL WIN CONDITIONS
            </h2>
            <p className="text-xs text-fuchsia-200/70 mb-2 leading-relaxed">
              To survive as a team, you must satisfy at least one condition:
            </p>
            <p className="text-xs text-fuchsia-200/70 mb-2 leading-relaxed font-bold">
              1. At least ONE team member guesses the correct flight telemetry bracket.
            </p>
            <p className="text-xs text-fuchsia-200/70 leading-relaxed font-bold">
              2. OR, ALL team members choose the EXACT same option (Unanimous Consensus).
            </p>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-zinc-500 tracking-widest mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-fuchsia-400" /> SQUAD ASSIGNMENT
            </h3>
            <div className="text-xs space-y-2">
              <div className="text-white font-bold">
                TEAM ID: <span className="text-fuchsia-400 uppercase">{myTeamId || "SYNCING..."}</span>
              </div>
              <div className="text-zinc-400">
                TEAM SIZE: <span className="text-white">{myTeamMembers.length} Operatives</span>
              </div>
              <p className="text-[10px] text-zinc-500 italic mt-2">
                Note: Teammates' answers are hidden until the round concludes.
              </p>
            </div>
          </div>
        </div>

        {/* Question & Options Panel */}
        <div className="md:col-span-2">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            {myQuestion ? (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2">
                  <HelpCircle className="w-4 h-4" /> SQUAD INQUIRY
                </div>
                <h2 className="text-lg font-bold text-white mb-6 leading-relaxed">
                  {myQuestion.question}
                </h2>

                <div className="space-y-3 mb-8">
                  {myQuestion.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = isRevealed && idx === myQuestion.correctIndex;

                    let optClass = "bg-black border-zinc-800 text-zinc-300 hover:border-fuchsia-500";

                    if (isRevealed) {
                      if (isCorrect) {
                        optClass = "bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]";
                      } else if (isSelected) {
                        optClass = "bg-zinc-900 border-zinc-700 text-zinc-500";
                      }
                    } else if (isSelected) {
                      optClass = "bg-fuchsia-950/40 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.3)]";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isLocked || isRevealed}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between ${optClass}`}
                      >
                        <span>{opt}</span>
                        {isRevealed && isCorrect && (
                          <span className="text-xs text-emerald-400 font-mono">CORRECT BRACKET</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!isRevealed ? (
                  <div className="flex justify-center">
                    <button
                      disabled={selectedOption === null || isLocked}
                      onClick={handleLockIn}
                      className="px-8 py-3.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-sm tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center gap-2"
                    >
                      {isLocked ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> ANSWER COMMITTED
                        </>
                      ) : (
                        "LOCK IN GUESS"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 text-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-emerald-400 font-bold text-sm">ROUND RESOLVED</div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Your squad satisfied survival conditions. Proceed to the Final Trial.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-600 text-sm">
                SYNCHRONIZING SQUAD INQUIRY...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
