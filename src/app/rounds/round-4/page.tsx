"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update, get } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound4RapidFire, advanceToRound, RAPID_FIRE_QUESTIONS } from "@/lib/gameEngine";
import {
  Zap,
  AlertTriangle,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Trophy,
  Heart,
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";
import { Header } from "@/components/theme/Header";
import { RulesModal } from "@/components/game/RulesModal";

const ROUND_DURATION = 30; // 30 seconds total rapid-fire

export default function Round4Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [playerLives, setPlayerLives] = useState<number>(3);
  const [playerScore, setPlayerScore] = useState<number>(0);

  // Question state
  const [questions] = useState(() => [...RAPID_FIRE_QUESTIONS]); // local copy, randomised server-side
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Timer — 30s total
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_DURATION);
  const [showRules, setShowRules] = useState(true);
  const [resolving, setResolving] = useState<boolean>(false);

  // Track answer reveal per question
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}`), (snap) => {
        const p = snap.val();
        if (!p) return;
        setPlayerStatus(p.status || "alive");
        setPlayerLives(p.lives ?? 3);
        setPlayerScore(p.score ?? 0);
      });
    }
    const unsubStatus = onValue(ref(database, "gameState/status"), (snap) => {
      if (snap.val() === "round5") router.push("/rounds/round-5");
    });
    const unsubR4 = onValue(ref(database, "gameState/round4/phase"), (snap) => {
      if (snap.val() === "revealed") setIsRevealed(true);
    });
    return () => { unsubUser(); unsubStatus(); unsubR4(); };
  }, [user, router]);

  // Global 30s countdown (only runs after rules dismissed)
  useEffect(() => {
    if (showRules || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRoundEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRules, isFinished]);

  const handleRoundEnd = useCallback(async () => {
    if (isFinished) return;
    setIsFinished(true);
    if (resolving) return;
    setResolving(true);
    try {
      await resolveRound4RapidFire();
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  }, [isFinished, resolving]);

  const submitAnswer = useCallback(async (optionIndex: number) => {
    if (answerRevealed || isFinished || !user) return;
    const q = questions[currentQIndex];
    if (!q) return;

    setSelectedOption(optionIndex);
    setAnswerRevealed(true);

    const isCorrect = optionIndex === q.correctIndex;

    // Update score / lives in Firebase
    const playerSnap = await get(ref(database, `players/${user.uid}`));
    const p = playerSnap.val() || {};
    const updates: Record<string, any> = {};

    if (isCorrect) {
      const newScore = (p.score || 0) + 1;
      updates[`players/${user.uid}/score`] = newScore;
      setPlayerScore(newScore);
    } else {
      const newLives = Math.max(0, (p.lives || 3) - 1);
      updates[`players/${user.uid}/lives`] = newLives;
      setPlayerLives(newLives);
      if (newLives <= 0) {
        updates[`players/${user.uid}/status`] = "eliminated";
        updates[`gameState/round4/eliminated/${user.uid}`] = true;
        setPlayerStatus("eliminated");
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }

    // Auto-advance to next question after 1.2s
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => {
      setAnswerRevealed(false);
      setSelectedOption(null);
      setCurrentQIndex((prev) => {
        const next = prev + 1;
        if (next >= questions.length) {
          handleRoundEnd();
          return prev;
        }
        return next;
      });
    }, 1200);
  }, [answerRevealed, isFinished, user, questions, currentQIndex, handleRoundEnd]);

  const handleNextRound = async () => {
    await advanceToRound("round5");
  };

  const amEliminated =
    playerStatus === "eliminated";

  if (amEliminated && !isRevealed) {
    return (
      <EliminationScreen
        title="ELIMINATED"
        message="You ran out of lives during the rapid fire round."
        roundName="ROUND 04 // RAPID FIRE [♣ CLUBS]"
        autoRedirectSeconds={5}
      />
    );
  }

  const currentQ = questions[currentQIndex];
  const progressPct = ((currentQIndex) / questions.length) * 100;
  const timePct = (timeLeft / ROUND_DURATION) * 100;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono flex flex-col justify-between select-none">
      {showRules && (
        <RulesModal roundIndex={3} onDismiss={() => setShowRules(false)} />
      )}
      <Header />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1c1b1b] p-5 border border-[#353534] shadow-xl">
          <div>
            <div className="text-[#ff544b] font-bold text-xs tracking-[0.25em] mb-1 flex items-center gap-1.5">
              <span>♣</span> <span>TRIAL 04 // RAPID FIRE KNOWLEDGE</span>
            </div>
            <h1 className="font-['Cinzel'] text-3xl font-black text-[#ffdad6] tracking-wider uppercase">
              RAPID FIRE // ALICE IN BORDERLAND
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Score */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#353534] bg-[#0e0e0e] text-xs">
              <Trophy className="w-4 h-4 text-[#ff544b]" />
              <span className="text-white font-black">{playerScore}</span>
              <span className="text-[#af8783]">PTS</span>
            </div>

            {/* Lives */}
            <div className="flex items-center gap-1 px-3 py-1.5 border border-[#353534] bg-[#0e0e0e]">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${i < playerLives ? "text-[#ff544b] fill-[#ff544b]" : "text-[#353534] fill-[#353534]"}`}
                />
              ))}
            </div>

            {/* Timer */}
            {!isFinished && !isRevealed ? (
              <div className={`flex items-center gap-2 text-2xl font-black font-mono ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-[#ff544b]"}`}>
                <Clock className="w-6 h-6" />
                {timeLeft}s
              </div>
            ) : isRevealed ? (
              <button
                onClick={handleNextRound}
                className="flex items-center gap-2 px-6 py-3 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-black text-xs uppercase tracking-widest rounded transition-colors cursor-pointer shadow-[0_0_20px_rgba(255,84,75,0.4)]"
              >
                NEXT ROUND <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#1c1b1b] border border-[#ff544b]/30 p-4 shadow-md">
              <h2 className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff544b]" /> RAPID FIRE RULES
              </h2>
              <p className="text-xs text-[#af8783] mb-2 leading-relaxed">
                Individual round — no teams. Answer Alice in Borderland questions.
              </p>
              <p className="text-xs text-[#ffdad6] mb-2 leading-relaxed font-bold">
                ✓ Correct = +1 point
              </p>
              <p className="text-xs text-[#ff544b] mb-2 leading-relaxed font-bold">
                ✗ Wrong = −1 life
              </p>
              <p className="text-xs text-[#af8783] leading-relaxed">
                Top 4 scorers advance to Round 5. 0 lives = eliminated.
              </p>
            </div>

            {/* Progress */}
            <div className="bg-[#1c1b1b] border border-[#353534] p-4 shadow-sm">
              <div className="text-xs font-bold text-[#af8783] tracking-widest uppercase mb-2">PROGRESS</div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#af8783]">Q {Math.min(currentQIndex + 1, questions.length)} / {questions.length}</span>
                <span className="text-[#ff544b] font-bold">{playerScore} PTS</span>
              </div>
              <div className="w-full bg-[#0e0e0e] h-2 border border-[#353534] overflow-hidden">
                <div
                  className="h-full bg-[#ff544b] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-3 text-xs font-bold text-[#af8783] tracking-widest uppercase mb-1.5">TIME LEFT</div>
              <div className="w-full bg-[#0e0e0e] h-2 border border-[#353534] overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-red-500" : "bg-[#ff544b]"}`}
                  style={{ width: `${timePct}%` }}
                />
              </div>
            </div>

            {/* Lives detail */}
            <div className="bg-[#1c1b1b] border border-[#353534] p-4 shadow-sm">
              <div className="text-xs font-bold text-[#af8783] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#ff544b]" /> OPERATIVE STATUS
              </div>
              <div className="flex gap-2 mb-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 ${i < playerLives ? "text-[#ff544b] fill-[#ff544b]" : "text-[#353534] fill-[#353534]"}`}
                  />
                ))}
              </div>
              <div className="text-xs text-[#af8783]">
                {playerLives} / 3 lives remaining
              </div>
            </div>
          </div>

          {/* Right: Question */}
          <div className="md:col-span-2">
            <div className="bg-[#1c1b1b] border border-[#353534] p-6 shadow-xl min-h-[400px] flex flex-col">
              {isRevealed ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-16 h-16 text-[#ff544b] mb-4" />
                  <div className="font-['Cinzel'] text-2xl font-black text-[#ffdad6] mb-2">RAPID FIRE COMPLETE</div>
                  <div className="text-sm text-[#af8783] mb-4">
                    Final Score: <span className="text-[#ff544b] font-black text-xl">{playerScore}</span> pts
                  </div>
                  <div className="text-xs text-[#af8783]">Top 4 scorers advance to the final trial.</div>
                </div>
              ) : isFinished ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="font-['Cinzel'] text-2xl font-black text-[#ffdad6] mb-2">TIME UP!</div>
                  <div className="text-sm text-[#af8783]">
                    Final Score: <span className="text-[#ff544b] font-black text-xl">{playerScore}</span> pts
                  </div>
                  <div className="text-xs text-[#af8783] mt-2 animate-pulse">Evaluating results...</div>
                </div>
              ) : currentQ ? (
                <div className="flex-1 flex flex-col">
                  {/* Question number badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#ffb4ab] uppercase tracking-wider">
                      <Zap className="w-4 h-4 text-[#ff544b]" /> QUESTION {currentQIndex + 1}
                    </div>
                    <div className="text-[10px] text-[#af8783]">
                      {questions.length - currentQIndex - 1} remaining
                    </div>
                  </div>

                  {/* Question text */}
                  <h2 className="text-lg font-bold text-white mb-6 leading-relaxed flex-1">
                    {currentQ.question}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === currentQ.correctIndex;

                      let btnStyle = "bg-[#0e0e0e] border-[#353534] text-neutral-300 hover:border-[#ff544b] hover:text-[#ffdad6]";

                      if (answerRevealed) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-950/50 border-emerald-500 text-emerald-400 font-bold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-[#93000a]/50 border-red-500 text-red-300 line-through";
                        } else {
                          btnStyle = "bg-[#0e0e0e] border-[#353534] text-neutral-600";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-[#ff544b] border-white text-[#5c0005] font-black shadow-[0_0_15px_rgba(255,84,75,0.7)]";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={answerRevealed || isFinished}
                          onClick={() => submitAnswer(idx)}
                          className={`w-full p-4 rounded border text-left font-mono text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>
                            <span className="text-[#ff544b] font-black mr-2">
                              {["A", "B", "C", "D"][idx]}.
                            </span>
                            {opt}
                          </span>
                          {answerRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                          {answerRevealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {answerRevealed && (
                    <div className={`mt-4 p-3 border text-center text-xs font-bold ${selectedOption === currentQ.correctIndex ? "border-emerald-500 text-emerald-400 bg-emerald-950/30" : "border-red-500 text-red-400 bg-red-950/30"}`}>
                      {selectedOption === currentQ.correctIndex
                        ? "✓ CORRECT — +1 POINT"
                        : `✗ WRONG — CORRECT: ${currentQ.options[currentQ.correctIndex]}`}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#af8783] text-xs">
                  Loading questions...
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
