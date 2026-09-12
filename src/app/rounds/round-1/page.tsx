"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { resolveRound1, advanceToRound } from "@/lib/gameEngine";
import { Aircraft } from "@/lib/airplanes";
import { Plane, Skull, AlertTriangle, ShieldCheck, Clock, FastForward, CheckCircle2, ChevronRight } from "lucide-react";
import { EliminationScreen } from "@/components/game/EliminationScreen";

export default function Round1Page() {
  const { user } = useAuth();
  const router = useRouter();

  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [r1State, setR1State] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<string>("alive");
  
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    const unsubAC = onValue(ref(database, "gameState/aircraftSnapshot"), (snap) => {
      if (snap.val()) setAircraftSnapshot(snap.val());
    });
    const unsubR1 = onValue(ref(database, "gameState/round1"), (snap) => {
      setR1State(snap.val());
    });
    let unsubUser = () => {};
    if (user) {
      unsubUser = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        setPlayerStatus(snap.val() || "alive");
      });
    }
    
    // Check if game moved to round 2
    const unsubStatus = onValue(ref(database, "gameState/status"), (snap) => {
      if (snap.val() === "round2") router.push("/rounds/round-2");
    });

    return () => { unsubAC(); unsubR1(); unsubUser(); unsubStatus(); };
  }, [user, router]);

  useEffect(() => {
    if (r1State?.phase === "revealed") return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleResolve();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [r1State?.phase]);

  const lockedSeats = useMemo(() => {
    return { ...(r1State?.botSeats || {}), ...(r1State?.lockedSeats || {}) };
  }, [r1State]);

  const handleLockIn = async () => {
    if (!user || !selectedSeat || isLocked || playerStatus !== "alive") return;
    setIsLocked(true);
    await update(ref(database), {
      [`gameState/round1/lockedSeats/${user.uid}`]: selectedSeat
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

  const handleNextRound = async () => {
    await advanceToRound("round2");
  };

  const isRevealed = r1State?.phase === "revealed";
  const amEliminated = playerStatus === "eliminated" || r1State?.eliminated?.[user?.uid || ""];

  if (amEliminated) {
    return (
      <EliminationScreen
        title="YOU DIED"
        message="Your seat was unsafe. Flight 404 experienced fatal structural failure."
        roundName="ROUND 01 // FLIGHT 404"
        autoRedirectSeconds={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <div className="text-amber-500 font-bold text-xs tracking-widest mb-1">ROUND 01</div>
          <h1 className="text-3xl font-black text-white">FLIGHT 404</h1>
        </div>
        
        {!isRevealed ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-black text-cyan-400 font-mono">
              <Clock className="w-6 h-6 text-cyan-500" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
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
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg transition-colors"
          >
            NEXT ROUND <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
            <h2 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> INSTRUCTIONS
            </h2>
            <p className="text-xs text-amber-200/70 mb-4 leading-relaxed">
              Deduce the 5 unsafe seats using the telemetry below. Choose carefully. Lock in before time runs out.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 tracking-widest">LIVE TELEMETRY</h3>
            {aircraftSnapshot.map((ac, i) => (
              <div key={i} className="bg-black/40 border border-zinc-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                    <Plane className="w-4 h-4" /> {ac.callsign}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono px-1.5 py-0.5 bg-zinc-900 rounded">
                    {ac.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-zinc-500">ALT:</span> <span className="text-white font-mono">{ac.altitude} ft</span></div>
                  <div><span className="text-zinc-500">SPD:</span> <span className="text-white font-mono">{ac.speed} kts</span></div>
                  <div><span className="text-zinc-500">TRK:</span> <span className="text-white font-mono">{ac.track}°</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="grid grid-cols-5 gap-3 mb-8">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((seat) => {
                const isUnsafe = isRevealed && r1State?.unsafeSeats?.includes(seat);
                const isSafe = isRevealed && !isUnsafe;
                
                // See if someone else locked it (hide details, just show taken unless it's yours)
                const occupant = Object.entries(lockedSeats).find(([_, s]) => s === seat);
                const isMine = occupant && occupant[0] === user?.uid;
                const isTaken = !!occupant && !isMine;

                let stateClasses = "bg-black border-zinc-700 text-zinc-500 hover:border-cyan-500 hover:text-cyan-400";
                
                if (isUnsafe) stateClasses = "bg-red-950 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                else if (isSafe) stateClasses = "bg-emerald-950/30 border-emerald-500/50 text-emerald-500";
                else if (isMine) stateClasses = "bg-cyan-950 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]";
                else if (selectedSeat === seat && !isLocked) stateClasses = "border-cyan-400 text-cyan-400 bg-cyan-950/30";
                else if (isTaken) stateClasses = "bg-zinc-800/50 border-zinc-800 text-zinc-600 cursor-not-allowed";

                return (
                  <button
                    key={seat}
                    disabled={isLocked || isTaken || isRevealed}
                    onClick={() => setSelectedSeat(seat)}
                    className={`aspect-square rounded-xl border-2 font-black text-xl flex items-center justify-center transition-all ${stateClasses}`}
                  >
                    {isUnsafe ? <Skull className="w-6 h-6" /> : isSafe ? <ShieldCheck className="w-6 h-6" /> : seat.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            {!isRevealed && (
              <div className="flex flex-col items-center">
                <button
                  disabled={!selectedSeat || isLocked}
                  onClick={handleLockIn}
                  className="px-8 py-3 bg-cyan-500 text-black font-black uppercase rounded-lg disabled:opacity-30 disabled:bg-zinc-600 disabled:text-zinc-400 transition-colors flex items-center gap-2"
                >
                  {isLocked ? (
                    <><CheckCircle2 className="w-5 h-5" /> LOCKED IN SEAT {selectedSeat}</>
                  ) : (
                    "LOCK IN SEAT"
                  )}
                </button>
              </div>
            )}
            
            {isRevealed && (
              <div className="text-center p-4 bg-black border border-zinc-800 rounded-lg">
                <div className="text-emerald-400 font-bold mb-1">ROUND RESOLVED</div>
                <div className="text-xs text-zinc-500">Unsafe seats were: {r1State?.unsafeSeats?.join(', ')}</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
