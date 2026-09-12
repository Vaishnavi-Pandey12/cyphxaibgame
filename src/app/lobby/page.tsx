"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, get, set, update, remove } from "firebase/database";
import { PlayerCard, Player } from "@/components/game/PlayerCard";
import { 
  Terminal, 
  Shield, 
  Bot, 
  Cpu, 
  Users, 
  Zap, 
  Radio, 
  Sparkles, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  Code2,
  RefreshCw,
  Lock,
  Flame
} from "lucide-react";
import Link from "next/link";

const TARGET_MAX_PLAYERS = 20;

export default function LobbyPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [gmConsoleOpen, setGmConsoleOpen] = useState(true);
  const [gmMessage, setGmMessage] = useState<string | null>(null);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "INITIALIZING ALICE_IN_HACKERLAND LOBBY NODE...",
    "CONNECTING TO SECURE REALTIME DATASTREAM...",
    "AUTHENTICATING SUBNET PROTOCOLS...",
  ]);

  // Dev check - visible in development mode or via dev flag
  const isDev = process.env.NODE_ENV === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost");

  // Add system logs with timestamp
  const logMessage = (msg: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setSystemLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 7)]);
  };

  // Subscribe to Firebase Realtime Database 'players' node
  useEffect(() => {
    try {
      const playersRef = ref(database, "players");
      logMessage("SUBSCRIBED: RTDB node /players connected.");

      const unsubscribe = onValue(
        playersRef,
        (snapshot) => {
          setLoading(false);
          setError(null);
          const data = snapshot.val();

          if (!data) {
            setPlayers([]);
            logMessage("REALTIME SYNC: 0 operatives in network.");
            return;
          }

          let playersList: Player[] = [];

          if (Array.isArray(data)) {
            playersList = data
              .map((item, index) => ({
                id: item?.id ? String(item.id) : `p_${index}`,
                ...item,
              }))
              .filter(Boolean);
          } else if (typeof data === "object") {
            playersList = Object.entries(data).map(([key, value]: [string, any]) => ({
              id: key,
              ...value,
            }));
          }

          // Filter only players whose status is 'alive'
          const alivePlayers = playersList.filter(
            (p) => p && typeof p.status === "string" && p.status.toLowerCase() === "alive"
          );

          setPlayers(alivePlayers);
          logMessage(`STREAM UPDATED: ${alivePlayers.length} ALIVE operatives verified.`);
        },
        (err) => {
          console.error("Firebase RTDB Error:", err);
          setError(`Database stream error: ${err.message}`);
          setLoading(false);
          logMessage(`ERROR: Connection fault: ${err.message}`);
        }
      );

      return () => unsubscribe();
    } catch (e: any) {
      console.error("Firebase setup error:", e);
      setError(e.message || "Failed to initialize database connection");
      setLoading(false);
    }
  }, []);

  // Filter alive operatives count
  const aliveCount = players.length;
  const progressPercent = Math.min(100, Math.round((aliveCount / TARGET_MAX_PLAYERS) * 100));

  // Game Master Button: Generate dummy bot players up to 20
  const handleGenerateDummyBots = async () => {
    setIsInjecting(true);
    setGmMessage(null);
    try {
      logMessage("GM_COMMAND: Initiating synthetic operative injection protocol...");
      
      // Fetch latest players snapshot from Firebase
      const playersRef = ref(database, "players");
      const snapshot = await get(playersRef);
      const currentData = snapshot.val() || {};

      let currentList: Player[] = [];
      if (Array.isArray(currentData)) {
        currentList = currentData.map((item, index) => ({ id: item?.id || `p_${index}`, ...item })).filter(Boolean);
      } else if (typeof currentData === "object") {
        currentList = Object.entries(currentData).map(([key, val]: [string, any]) => ({ id: key, ...val }));
      }

      // Check current player count (all or alive)
      const currentCount = currentList.length;
      const neededBots = Math.max(0, TARGET_MAX_PLAYERS - currentCount);

      if (neededBots <= 0) {
        setGmMessage(`MAX CAPACITY REACHED: Lobby already has ${currentCount} / ${TARGET_MAX_PLAYERS} operatives.`);
        logMessage(`GM_NOTICE: Max capacity of ${TARGET_MAX_PLAYERS} reached. No bots injected.`);
        setIsInjecting(false);
        return;
      }

      // Find existing bot indices to avoid alias collisions
      const existingBotNumbers = new Set<number>();
      currentList.forEach((p) => {
        const alias = p.alias || p.name || "";
        const match = alias.match(/Bot\s*(\d+)/i);
        if (match && match[1]) {
          existingBotNumbers.add(parseInt(match[1], 10));
        }
      });

      const updates: Record<string, any> = {};
      let botIndex = 1;

      for (let i = 0; i < neededBots; i++) {
        // Find next available bot number
        while (existingBotNumbers.has(botIndex)) {
          botIndex++;
        }
        existingBotNumbers.add(botIndex);

        const paddedNum = String(botIndex).padStart(3, "0");
        const botId = `bot_${paddedNum}_${Date.now().toString(36).slice(-4)}`;
        const botAlias = `Bot ${paddedNum}`;

        updates[botId] = {
          id: botId,
          alias: botAlias,
          name: botAlias,
          username: botAlias,
          status: "alive",
          isBot: true,
          role: "bot",
          joinedAt: Date.now() + i * 10,
          score: 0,
          avatar: "bot",
        };

        botIndex++;
      }

      // Save directly to the Firebase players node
      await update(playersRef, updates);

      setGmMessage(`SUCCESS: Injected ${neededBots} dummy bot operatives. Total lobby: ${currentCount + neededBots}/${TARGET_MAX_PLAYERS}.`);
      logMessage(`GM_SUCCESS: Injected ${neededBots} synthetic AI bots into /players node.`);
    } catch (err: any) {
      console.error("Failed to generate dummy bots:", err);
      setGmMessage(`ERROR: ${err.message || "Failed to write bots to Firebase"}`);
      logMessage(`GM_ERROR: Injection failed: ${err.message}`);
    } finally {
      setIsInjecting(false);
    }
  };

  // Game Master helper: Clear all synthetic bots
  const handleClearBots = async () => {
    setIsClearing(true);
    setGmMessage(null);
    try {
      logMessage("GM_COMMAND: Purging all synthetic operatives...");
      const playersRef = ref(database, "players");
      const snapshot = await get(playersRef);
      const currentData = snapshot.val() || {};

      const updates: Record<string, any> = {};
      let botsRemoved = 0;

      if (typeof currentData === "object" && !Array.isArray(currentData)) {
        Object.entries(currentData).forEach(([key, val]: [string, any]) => {
          const isBot = val?.isBot || (val?.alias && val.alias.toLowerCase().startsWith("bot")) || val?.role === "bot";
          if (isBot) {
            updates[key] = null; // deletes key in Firebase RTDB update
            botsRemoved++;
          }
        });
      }

      if (botsRemoved > 0) {
        await update(playersRef, updates);
        setGmMessage(`PURGE COMPLETE: Removed ${botsRemoved} synthetic bots.`);
        logMessage(`GM_PURGE: Removed ${botsRemoved} bot operatives.`);
      } else {
        setGmMessage("No synthetic bots found to remove.");
      }
    } catch (err: any) {
      console.error("Failed to clear bots:", err);
      setGmMessage(`ERROR: ${err.message || "Failed to clear bots"}`);
    } finally {
      setIsClearing(false);
    }
  };

  // Copy Lobby Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate empty operative slots to show waiting spots
  const emptySlotsCount = Math.max(0, TARGET_MAX_PLAYERS - aliveCount);

  return (
    <div className="relative min-h-screen bg-[#040810] text-[#e6edf3] font-mono selection:bg-cyan-500 selection:text-black overflow-x-hidden scanlines">
      {/* Background Cyber Grid & Vignette */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-40 z-0" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-0" />

      {/* Cyber Neon Accents */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        
        {/* Top Cyber Navigation / Status Bar */}
        <header className="mb-6 rounded-2xl border border-cyan-500/30 bg-[#091120]/90 backdrop-blur-md p-4 sm:p-6 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Title & Lore */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Terminal className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded">
                    SECTOR // 07
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE RTDB NODE
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 mt-1">
                  ALICE IN HACKERLAND
                </h1>
                <p className="text-xs text-zinc-400 tracking-wide mt-0.5">
                  CENTRAL NODE WAITING ROOM &bull; SURVIVAL PROTOCOL LOADED
                </p>
              </div>
            </div>

            {/* Quick Actions & Room Info */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 hover:border-cyan-400 text-xs font-mono transition-colors text-zinc-300 hover:text-white"
                title="Copy Room Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? "COPIED" : "SHARE FREQUENCY"}</span>
              </button>

              <Link
                href="/rounds/round-1"
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-lg ${
                  aliveCount >= TARGET_MAX_PLAYERS
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:opacity-95 shadow-[0_0_20px_rgba(0,255,102,0.4)] animate-pulse"
                    : "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60"
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{aliveCount >= TARGET_MAX_PLAYERS ? "INITIALIZE ROUND 1" : "ENTER ARENA"}</span>
              </Link>
            </div>
          </div>

          {/* Player Capacity Bar */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-zinc-300 font-bold">ALIVE OPERATIVES:</span>
                <span className="text-cyan-400 font-extrabold text-sm">{aliveCount}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">{TARGET_MAX_PLAYERS} REQUIRED</span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {aliveCount >= TARGET_MAX_PLAYERS ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> GRID READY
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium">
                    WAITING FOR {TARGET_MAX_PLAYERS - aliveCount} MORE...
                  </span>
                )}
              </span>
            </div>

            {/* Progress Meter */}
            <div className="w-full h-2.5 bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* Database Error Banner if any */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">FIREBASE CONNECTION WARNING:</span> {error}
            </div>
          </div>
        )}

        {/* System Terminal & Network Logs */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-[#070d18]/80 p-3 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-2 mb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE SUBNET TERMINAL LOGS</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>FIREBASE RTDB: /players</span>
            </div>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-zinc-400">
            {systemLogs.map((log, idx) => (
              <div key={idx} className={idx === 0 ? "text-cyan-300 font-semibold" : "text-zinc-500"}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Alive Players Grid Section */}
        <main className="flex-1 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wider">
                ACTIVE OPERATIVES ON GRID
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                {aliveCount} ALIVE
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-cyan-500/20 bg-[#091120]/40">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <p className="text-sm font-bold text-cyan-300 tracking-wider">SCANNING SECTOR FREQUENCIES...</p>
              <p className="text-xs text-zinc-500 mt-1">Fetching alive operative telemetry from Firebase RTDB</p>
            </div>
          ) : aliveCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-[#080d1a]/50 text-center p-6">
              <Users className="w-12 h-12 text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-300">NO ALIVE OPERATIVES DETECTED</h3>
              <p className="text-xs text-zinc-500 max-w-md mt-1 mb-4">
                The node is currently vacant or all operatives are eliminated. Connect from login or use the Game Master terminal below to populate dummy bots.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Alive Operatives Cards */}
              {players.map((player, index) => (
                <PlayerCard key={player.id || index} player={player} index={index} />
              ))}

              {/* Ghost / Empty Waiting Slots */}
              {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="rounded-xl border border-dashed border-zinc-800/80 bg-[#060a14]/40 p-4 flex flex-col items-center justify-center min-h-[140px] text-zinc-600 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full border border-dashed border-zinc-800 flex items-center justify-center mb-2">
                    <span className="text-[10px] font-mono text-zinc-600">
                      {String(aliveCount + idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">AWAITING OPERATIVE</span>
                  <span className="text-[9px] font-mono text-zinc-700 mt-0.5">SLOT OPEN</span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* SECRET GAME MASTER DEV TERMINAL (VISIBLE IN DEVELOPMENT ONLY) */}
        {isDev && (
          <div className="mt-auto mb-4 rounded-2xl border-2 border-purple-500/50 bg-[#0e0a1f]/95 backdrop-blur-xl p-5 shadow-[0_0_35px_rgba(157,78,221,0.25)] relative overflow-hidden">
            {/* Hacker Strip Pattern */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400" />
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-purple-500 text-black">
                      DEV OVERRIDE
                    </span>
                    <span className="text-xs font-bold text-purple-300">
                      SECRET GAME MASTER CONSOLE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Visible during development &bull; Directly mutates Firebase <code className="text-purple-300 font-bold">/players</code> node
                  </p>
                </div>
              </div>

              {/* Game Master Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Main Required GM Button: Generate Dummy Bots Up To 20 */}
                <button
                  onClick={handleGenerateDummyBots}
                  disabled={isInjecting || isClearing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(157,78,221,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {isInjecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span>
                    {isInjecting ? "INJECTING SYNTHETICS..." : "⚡ FILL TO 20 BOTS (GM OVERRIDE)"}
                  </span>
                </button>

                {/* Clear Bots Utility */}
                <button
                  onClick={handleClearBots}
                  disabled={isInjecting || isClearing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-500 text-zinc-300 hover:text-red-400 text-xs font-mono transition-colors disabled:opacity-50"
                  title="Purge all dummy bots from players node"
                >
                  {isClearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>PURGE BOTS</span>
                </button>
              </div>
            </div>

            {/* GM Feedback Message */}
            {gmMessage && (
              <div className="mt-3 p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>{gmMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <footer className="py-4 text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALICE IN HACKERLAND &bull; SYSTEM PROTOCOL v2.4.0</span>
          <span>SECURITY NODE: 0xDEADBEEF // RTDB_ENCRYPTED</span>
        </footer>

      </div>
    </div>
  );
}
