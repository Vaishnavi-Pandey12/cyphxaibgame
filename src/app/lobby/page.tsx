"use client";

import React, { useEffect, useState, useCallback } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { startGame, resetToLobby } from "@/lib/gameEngine";
import { Play, RefreshCw, Users, Zap, Terminal, LogOut, RotateCcw } from "lucide-react";

const ROUND_ROUTES: Record<string, string> = {
  round1: "/rounds/round-1",
  round2: "/rounds/round-2",
  round3: "/rounds/round-3",
  round4: "/rounds/round-4",
  round5: "/rounds/round-5",
};

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
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono relative overflow-hidden">
      <div className="fixed inset-0 bg-grid-cyber opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                Lobby Node // Secure Channel
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
              skynet:borderland
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-black/40 text-xs">
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-[10px]">
                  {(user.displayName || user.email || "?")[0].toUpperCase()}
                </div>
                <span className="text-zinc-400 max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-lg border border-zinc-800 hover:border-red-500/50 text-zinc-600 hover:text-red-400 transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "HUMANS", value: humanPlayers.length, color: "text-cyan-400" },
            { label: "BOTS", value: botPlayers.length, color: "text-purple-400" },
            { label: "OPEN SLOTS", value: emptySlots, color: "text-zinc-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800 bg-black/40 p-3 text-center"
            >
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5 tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* START GAME */}
        <div className="mb-8">
          <div className="rounded-2xl border border-cyan-500/20 bg-black/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-black text-white tracking-wider mb-1">
                {isWaiting ? "READY TO BEGIN" : "SIMULATION IN PROGRESS"}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {isWaiting
                  ? `Click START to fill empty slots with ${emptySlots} bots and begin the 5-round survival protocol.`
                  : `A previous simulation is active. You can reset and start a fresh trial at any time.`}
              </p>
              {startError && (
                <p className="text-red-400 text-xs mt-2 font-bold">{startError}</p>
              )}
            </div>

            {isWaiting ? (
              <button
                onClick={handleStartGame}
                disabled={isStarting}
                className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-black text-sm tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,240,255,0.25)] whitespace-nowrap flex-shrink-0"
              >
                {isStarting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                {isStarting ? "INITIALIZING..." : "START GAME"}
              </button>
            ) : (
              <button
                onClick={handleResetAndStart}
                disabled={isStarting}
                className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-black font-black text-sm tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(239,68,68,0.25)] whitespace-nowrap flex-shrink-0"
              >
                {isStarting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
                {isStarting ? "RESETTING..." : "RESET & START NEW GAME"}
              </button>
            )}
          </div>
        </div>

        {/* Rounds legend */}
        <div className="mb-6 grid grid-cols-5 gap-2 text-center">
          {[
            { n: "01", name: "FLIGHT 404", color: "border-amber-500/30 text-amber-400" },
            { n: "02", name: "FISHING", color: "border-teal-500/30 text-teal-400" },
            { n: "03", name: "REDLINE", color: "border-red-500/30 text-red-400" },
            { n: "04", name: "SAME PAGE", color: "border-fuchsia-500/30 text-fuchsia-400" },
            { n: "05", name: "DEJA VU", color: "border-yellow-500/30 text-yellow-400" },
          ].map((r) => (
            <div key={r.n} className={`rounded-lg border ${r.color.split(" ")[0]} bg-black/30 px-2 py-2`}>
              <div className={`text-[10px] font-black ${r.color.split(" ")[1]}`}>{r.n}</div>
              <div className="text-[9px] text-zinc-600 mt-0.5 leading-tight">{r.name}</div>
            </div>
          ))}
        </div>

        {/* Player grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">
              Operatives ({players.length} / 20)
            </span>
          </div>

          {dbLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-600 text-xs tracking-widest">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> SCANNING...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {players.map((p, i) => (
                <div
                  key={p.id || i}
                  className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 text-xs ${
                    p.id === user?.uid
                      ? "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                      : p.isBot
                      ? "border-purple-500/20 bg-purple-950/10"
                      : "border-zinc-800 bg-black/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      p.connected ? "bg-emerald-400" : "bg-zinc-700"
                    }`}
                  />
                  <span className="font-bold truncate flex-1 text-[11px]">
                    {p.alias || p.name || "Unknown"}
                  </span>
                  {p.id === user?.uid && (
                    <span className="text-[9px] text-cyan-400 font-bold">YOU</span>
                  )}
                  {p.isBot && (
                    <span className="text-[9px] text-purple-400">BOT</span>
                  )}
                </div>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="rounded-xl border border-dashed border-zinc-800/50 px-3 py-2.5 flex items-center justify-center"
                >
                  <span className="text-[10px] text-zinc-700">OPEN</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
