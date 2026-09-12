"use client";

import React, { useEffect, useState, useCallback } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  resolveRound1,
  advanceToRound,
  assignBotSeatsRound1,
} from "@/lib/gameEngine";
import {
  Globe,
  AlertTriangle,
  ShieldCheck,
  Clock,
  FastForward,
  CheckCircle2,
  ChevronRight,
  Skull,
  MapPin,
  Banknote,
  Users,
} from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";
import { Header } from "@/components/theme/Header";
import { RulesModal } from "@/components/game/RulesModal";

export default function Round1Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [r1State, setR1State] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showRules, setShowRules] = useState(true);

  // Timer — 60s
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerStarted, setTimerStarted] = useState(false);
  const [botsAssigned, setBotsAssigned] = useState(false);

  useEffect(() => {
    const unsubR1 = onValue(ref(database, "gameState/round1"), (snap) => {
      setR1State(snap.val());
    });
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        setPlayerStatus(snap.val() || "alive");
      });
    }
    const unsubStatus = onValue(ref(database, "gameState/status"), (snap) => {
      if (snap.val() === "round2") router.push("/rounds/round-2");
    });
    return () => { unsubR1(); unsubUser(); unsubStatus(); };
  }, [user, router]);

  // Start timer once rules are dismissed
  useEffect(() => {
    if (showRules || r1State?.phase === "revealed" || timerStarted) return;
    setTimerStarted(true);
  }, [showRules, r1State?.phase, timerStarted]);

  // Main countdown
  useEffect(() => {
    if (!timerStarted || r1State?.phase === "revealed") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimerExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStarted, r1State?.phase]);

  const handleTimerExpired = useCallback(async () => {
    // First: assign bot seats
    if (!botsAssigned) {
      setBotsAssigned(true);
      try {
        await assignBotSeatsRound1();
      } catch (e) {
        console.error("Bot seat assignment failed:", e);
      }
    }
    // Then resolve
    await handleResolve();
  }, [botsAssigned]);

  const handleLockIn = async () => {
    if (!user || selectedSeatIndex === null || isLocked || playerStatus !== "alive") return;
    setIsLocked(true);
    await update(ref(database), {
      [`gameState/round1/lockedSeats/${user.uid}`]: selectedSeatIndex,
    });
  };

  const handleResolve = async () => {
    if (resolving || r1State?.phase === "revealed") return;
    setResolving(true);
    try {
      await resolveRound1();
    } catch (e) {
      console.error(e);
      setResolving(false);
    }
  };

  const handleSkip = async () => {
    if (!botsAssigned) {
      setBotsAssigned(true);
      try { await assignBotSeatsRound1(); } catch {}
    }
    await handleResolve();
  };

  const handleNextRound = async () => {
    await advanceToRound("round2");
  };

  const isRevealed = r1State?.phase === "revealed";
  const safeIndex: number = r1State?.safeIndex ?? -1;
  const hintCountry = r1State?.hintCountry;
  const seatCountries: any[] = r1State?.seatCountries || [];
  const lockedSeats: Record<string, number> = {
    ...(r1State?.botSeats || {}),
    ...(r1State?.lockedSeats || {}),
  };

  const amEliminated =
    playerStatus === "eliminated" || r1State?.eliminated?.[user?.uid || ""];

  if (amEliminated) {
    return (
      <EliminationScreen
        title="YOU DIED"
        message="You chose the wrong country. The seat was unsafe."
        roundName="ROUND 01 // COUNTRY CIPHER [♦ DIAMONDS]"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono flex flex-col justify-between select-none">
      {showRules && (
        <RulesModal roundIndex={0} onDismiss={() => setShowRules(false)} />
      )}
      <Header />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1c1b1b] p-5 border border-[#353534] shadow-xl">
          <div>
            <div className="text-[#ff544b] font-bold text-xs tracking-[0.25em] mb-1 flex items-center gap-1.5">
              <span>♦</span> <span>TRIAL 01 // COUNTRY CIPHER</span>
            </div>
            <h1 className="font-['Cinzel'] text-3xl font-black text-[#ffdad6] tracking-wider uppercase">
              FLIGHT 404 // THE LAST SEAT
            </h1>
          </div>

          {!isRevealed ? (
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-2xl font-black font-mono ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-[#ff544b]"}`}>
                <Clock className="w-6 h-6" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
              <button
                onClick={handleSkip}
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
          {/* Left Panel: Hints */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#1c1b1b] border border-[#ff544b]/30 p-4 shadow-md">
              <h2 className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff544b]" /> INTEL DECRYPTION
              </h2>
              <p className="text-xs text-[#af8783] leading-relaxed">
                One of the 20 country seats is safe. Decode the 3 hints below to identify it and lock in before the timer expires.
              </p>
            </div>

            {/* 3 Hints */}
            {hintCountry ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#af8783] tracking-widest uppercase">
                  COUNTRY HINTS
                </h3>

                {/* Hint 1: Capital */}
                <div className="bg-[#1c1b1b] border border-[#353534] p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[#ffb4ab] font-bold text-[10px] uppercase tracking-widest mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff544b]" /> HINT 1 — CAPITAL
                  </div>
                  <div className="text-sm text-white font-black">
                    {hintCountry.capital}
                  </div>
                  <div className="text-[10px] text-[#af8783] mt-0.5">
                    Capital city of the target country
                  </div>
                </div>

                {/* Hint 2: Currency */}
                <div className="bg-[#1c1b1b] border border-[#353534] p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[#ffb4ab] font-bold text-[10px] uppercase tracking-widest mb-1.5">
                    <Banknote className="w-3.5 h-3.5 text-[#ff544b]" /> HINT 2 — CURRENCY
                  </div>
                  <div className="text-sm text-white font-black">
                    {hintCountry.currency}
                    <span className="text-[#ff544b] ml-2 text-xs">({hintCountry.currencyCode})</span>
                  </div>
                  <div className="text-[10px] text-[#af8783] mt-0.5">
                    Official currency of the target country
                  </div>
                </div>

                {/* Hint 3: Population */}
                <div className="bg-[#1c1b1b] border border-[#353534] p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[#ffb4ab] font-bold text-[10px] uppercase tracking-widest mb-1.5">
                    <Users className="w-3.5 h-3.5 text-[#ff544b]" /> HINT 3 — POPULATION
                  </div>
                  <div className="text-sm text-white font-black">
                    {hintCountry.populationRange}
                  </div>
                  <div className="text-[10px] text-[#af8783] mt-0.5">
                    Approximate population range
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1c1b1b] border border-[#353534] p-4 text-xs text-[#af8783] text-center">
                Syncing country intel...
              </div>
            )}

            {/* Reveal result */}
            {isRevealed && (
              <div className="bg-[#1c1b1b] border border-emerald-500/40 p-3 shadow-sm">
                <div className="text-emerald-400 font-bold text-xs mb-1">SAFE COUNTRY WAS:</div>
                <div className="text-white font-black text-sm flex items-center gap-2">
                  <span>{hintCountry?.flag}</span>
                  <span>{hintCountry?.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Seat Grid */}
          <div className="md:col-span-2">
            <div className="bg-[#1c1b1b] border border-[#353534] p-6 shadow-xl">
              <div className="text-xs text-[#af8783] font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#ff544b]" /> COUNTRY SEAT MATRIX (20 SEATS)
                </span>
                <span className="text-[#ff544b] font-bold">1 SAFE // 19 UNSAFE</span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {seatCountries.map((seat: any) => {
                  const idx = seat.index;
                  const isSafe = isRevealed && idx === safeIndex;
                  const isUnsafe = isRevealed && idx !== safeIndex;
                  const occupant = Object.entries(lockedSeats).find(([, s]) => s === idx);
                  const isMine = occupant && occupant[0] === user?.uid;
                  const isTaken = !!occupant && !isMine;
                  const isSelected = selectedSeatIndex === idx && !isLocked;

                  let stateClasses =
                    "bg-[#0e0e0e] border-[#353534] text-neutral-400 hover:border-[#ff544b] hover:text-[#ffdad6]";

                  if (isUnsafe)
                    stateClasses = "bg-[#93000a]/60 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
                  else if (isSafe)
                    stateClasses = "bg-emerald-950/40 border-emerald-500 text-emerald-400";
                  else if (isMine)
                    stateClasses = "bg-[#ff544b] border-white text-[#5c0005] shadow-[0_0_15px_rgba(255,84,75,0.7)] font-black";
                  else if (isSelected)
                    stateClasses = "border-[#ff544b] text-[#ffdad6] bg-[#2a2a2a]";
                  else if (isTaken)
                    stateClasses = "bg-[#201f1f]/50 border-[#353534] text-[#5f3f3b] cursor-not-allowed";

                  return (
                    <button
                      key={idx}
                      disabled={isLocked || isTaken || isRevealed}
                      onClick={() => setSelectedSeatIndex(idx)}
                      className={`relative border-2 font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer p-2 min-h-[56px] ${stateClasses}`}
                    >
                      {isUnsafe ? (
                        <>
                          <Skull className="w-4 h-4 text-red-400 mb-0.5" />
                          <span className="text-[8px] leading-tight text-center break-words max-w-full px-0.5 line-clamp-2">
                            {seat.name}
                          </span>
                        </>
                      ) : isSafe ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400 mb-0.5" />
                          <span className="text-[8px] leading-tight text-center break-words max-w-full px-0.5 line-clamp-2">
                            {seat.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm leading-none mb-0.5">{seat.flag}</span>
                          <span className="text-[8px] leading-tight text-center break-words max-w-full px-0.5 line-clamp-2">
                            {seat.name}
                          </span>
                          {isMine && (
                            <span className="text-[7px] mt-0.5 text-[#5c0005] font-black">YOU</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}

                {/* Loading placeholder */}
                {seatCountries.length === 0 &&
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="border-2 border-dashed border-[#353534] bg-[#0e0e0e]/50 min-h-[56px] flex items-center justify-center"
                    >
                      <span className="text-[10px] text-[#5f3f3b] animate-pulse">...</span>
                    </div>
                  ))}
              </div>

              {!isRevealed && (
                <div className="flex flex-col items-center">
                  <button
                    disabled={selectedSeatIndex === null || isLocked || seatCountries.length === 0}
                    onClick={handleLockIn}
                    className="px-8 py-3.5 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono font-black uppercase text-xs sm:text-sm tracking-[0.2em] rounded disabled:opacity-30 disabled:bg-[#353534] disabled:text-[#af8783] transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isLocked ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        LOCKED:{" "}
                        {seatCountries[selectedSeatIndex ?? 0]?.name || "—"}
                      </>
                    ) : selectedSeatIndex !== null ? (
                      <>LOCK IN: {seatCountries[selectedSeatIndex]?.name}</>
                    ) : (
                      "SELECT A COUNTRY SEAT"
                    )}
                  </button>
                  {isLocked && (
                    <p className="text-xs text-[#af8783] mt-2">
                      Seat locked. Awaiting timer to expire...
                    </p>
                  )}
                </div>
              )}

              {isRevealed && (
                <div className="text-center p-4 bg-[#0e0e0e] border border-[#353534]">
                  <div className="text-emerald-400 font-bold mb-1 font-mono">
                    TRIAL 01 RESOLVED
                  </div>
                  <div className="text-xs text-[#af8783]">
                    Safe seat was: {hintCountry?.flag} {hintCountry?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
