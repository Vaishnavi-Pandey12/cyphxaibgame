"use client";

import React, { useEffect, useState, useCallback } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { startGame, resetToLobby } from "@/lib/gameEngine";
import { Play, RefreshCw, Users, RotateCcw, LogOut } from "lucide-react";
import { Header } from "@/components/theme/Header";

const ROUND_ROUTES: Record<string, string> = {
  round1: "/rounds/round-1",
  round2: "/rounds/round-2",
  round3: "/rounds/round-3",
  round4: "/rounds/round-4",
  round5: "/rounds/round-5",
};

const SUIT_ICONS = ["♦", "♠", "♣", "♥"];

export default function LobbyPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("waiting");
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  // Subscribe to players
  useEffect(() => {
    const unsub = onValue(ref(database, "players"), (snap) => {
      const data = snap.val() || {};
      setPlayers(Object.values(data));
      setDbLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to game status — auto-redirect when game starts
  useEffect(() => {
    const unsub = onValue(ref(database, "gameState/status"), (snap) => {
      const status = snap.val() || "waiting";
      setGameStatus(status);
      if (ROUND_ROUTES[status]) router.push(ROUND_ROUTES[status]);
    });
    return () => unsub();
  }, [router]);

  const handleStartGame = useCallback(async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await startGame();
    } catch (e: any) {
      setStartError(e.message || "Failed to start. Try again.");
      setIsStarting(false);
    }
  }, []);

  const handleResetAndStart = useCallback(async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await resetToLobby(user?.uid);
      await startGame();
    } catch (e: any) {
      setStartError(e.message || "Failed to reset and start. Try again.");
      setIsStarting(false);
    }
  }, [user]);

  const humanPlayers = players.filter((p) => !p.isBot);
  const botPlayers = players.filter((p) => p.isBot);
  const emptySlots = Math.max(0, 20 - players.length);
  const isWaiting = gameStatus === "waiting";

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-mono relative overflow-hidden flex flex-col justify-between">
      <Header />

      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        {/* Header Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1c1b1b] p-5 border border-[#353534] shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#ff544b] animate-ping" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#ffb4ab] uppercase">
                ARENA LOBBY // SECURE TOKYO DISPATCH
              </span>
            </div>
            <h1 className="font-['Cinzel'] text-3xl font-black text-[#ffdad6] tracking-wider uppercase">
              CRUCIBLE GATHERING DECK
            </h1>
            <p className="text-xs text-[#af8783] mt-0.5">
              Flight AI204 Airspace • 20 Operatives Maximum • Automatic Bot Deployment
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 border border-[#353534] bg-[#0e0e0e] text-xs">
                <div className="w-6 h-6 bg-[#920703] text-white flex items-center justify-center font-bold text-[10px]">
                  {(user.displayName || user.email || "?")[0].toUpperCase()}
                </div>
                <span className="text-[#ffdad6] max-w-[130px] truncate font-bold">
                  {user.displayName || user.email}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 border border-[#353534] hover:border-[#ff544b] text-[#af8783] hover:text-[#ff544b] transition-colors cursor-pointer"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "HUMAN OPERATIVES", value: humanPlayers.length, color: "text-[#ff544b]" },
            { label: "AI DRONES (BOTS)", value: botPlayers.length, color: "text-[#ffb4ab]" },
            { label: "AVAILABLE VACANCIES", value: emptySlots, color: "text-zinc-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-[#353534] bg-[#1c1b1b] p-4 text-center shadow-md"
            >
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-[#af8783] mt-1 tracking-wider uppercase font-bold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* START GAME BANNER */}
        <div className="mb-6">
          <div className="border-2 border-[#ff544b]/50 bg-[#1c1b1b] p-6 shadow-[0_0_30px_rgba(255,84,75,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-['Cinzel'] text-lg font-black text-[#ffdad6] tracking-wider mb-1 uppercase">
                {isWaiting ? "SURVIVAL TRIAL PRIMED" : "SIMULATION IN PROGRESS"}
              </div>
              <p className="text-xs text-[#af8783] leading-relaxed max-w-xl">
                {isWaiting
                  ? `Press START to instantly backfill ${emptySlots} generic bots, fetch live transponder vectors, and trigger Trial 01.`
                  : `A previous simulation cycle is currently active. You can restart the lobby immediately.`}
              </p>
              {startError && (
                <p className="text-[#ff544b] text-xs mt-2 font-bold">{startError}</p>
              )}
            </div>

            {isWaiting ? (
              <button
                onClick={handleStartGame}
                disabled={isStarting}
                className="flex items-center gap-3 px-8 py-4 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono font-black text-xs sm:text-sm tracking-[0.25em] uppercase transition-all shadow-[0_0_25px_rgba(255,84,75,0.5)] cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                <span>{isStarting ? "SYNCHRONIZING..." : "[ START TRIAL → ]"}</span>
              </button>
            ) : (
              <button
                onClick={handleResetAndStart}
                disabled={isStarting}
                className="flex items-center gap-3 px-8 py-4 bg-[#920703] hover:bg-[#ff544b] text-white font-mono font-black text-xs sm:text-sm tracking-[0.25em] uppercase transition-all shadow-[0_0_25px_rgba(255,84,75,0.5)] cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
                <span>{isStarting ? "RESETTING..." : "[ RESET & RESTART ]"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Stages Ticker */}
        <div className="mb-6 grid grid-cols-5 gap-2 text-center">
          {[
            { n: "01", name: "FLIGHT 404", suit: "♦", sub: "SPEED" },
            { n: "02", name: "FISHING", suit: "♠", sub: "SONAR" },
            { n: "03", name: "REDLINE", suit: "♠", sub: "LASER" },
            { n: "04", name: "SAME PAGE", suit: "♣", sub: "TEAM" },
            { n: "05", name: "DEJA VU", suit: "♥", sub: "FINAL" },
          ].map((r) => (
            <div key={r.n} className="border border-[#353534] bg-[#1c1b1b] px-2 py-2">
              <div className="text-xs font-black text-[#ff544b] flex items-center justify-center gap-1">
                <span>{r.suit}</span>
                <span>{r.n}</span>
              </div>
              <div className="text-[10px] text-[#e5e2e1] mt-0.5 font-bold uppercase">{r.name}</div>
              <div className="text-[9px] text-[#af8783]">{r.sub}</div>
            </div>
          ))}
        </div>

        {/* Player Roster Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-[#353534] pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff544b]" />
              <span className="text-xs font-bold text-[#ffdad6] tracking-wider uppercase">
                OPERATIVES IN DECK ({players.length} / 20)
              </span>
            </div>
            <span className="text-[10px] text-[#af8783]">LOBBY FULL AT 20</span>
          </div>

          {dbLoading ? (
            <div className="flex items-center justify-center py-12 text-[#af8783] text-xs tracking-widest">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> SCANNING SATELLITE TELEMETRY...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {players.map((p, i) => {
                const isMe = p.id === user?.uid;
                const suitIcon = SUIT_ICONS[i % 4];
                return (
                  <div
                    key={p.id || i}
                    className={`border px-3 py-2.5 flex items-center gap-2 text-xs transition-all ${
                      isMe
                        ? "border-[#ff544b] bg-[#2a2a2a] shadow-[0_0_15px_rgba(255,84,75,0.3)]"
                        : p.isBot
                        ? "border-[#353534] bg-[#1c1b1b]"
                        : "border-[#5f3f3b] bg-[#201f1f]"
                    }`}
                  >
                    <span className="text-[#ff544b] font-bold text-xs">{suitIcon}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        p.connected ? "bg-emerald-400" : "bg-[#ff544b]"
                      }`}
                    />
                    <span className="font-bold truncate flex-1 text-[11px] text-[#e5e2e1]">
                      {p.alias || p.name || "Unknown"}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-[#ff544b] text-[#5c0005] font-bold px-1">YOU</span>
                    )}
                    {p.isBot && (
                      <span className="text-[9px] text-[#af8783] font-bold">BOT</span>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="border border-dashed border-[#353534] px-3 py-2.5 flex items-center justify-center bg-[#0e0e0e]/50"
                >
                  <span className="text-[10px] text-[#5f3f3b] font-bold uppercase tracking-widest">
                    [ VACANCY ]
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
