"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, set, update } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";
import { Player } from "@/components/game/PlayerCard";
import { 
  AlertOctagon, 
  ArrowLeft, 
  Bot, 
  Cpu, 
  Eye, 
  Flame, 
  Lock, 
  Plane, 
  Radio, 
  RefreshCw, 
  Shield, 
  Skull, 
  Terminal, 
  User, 
  Users, 
  Vote, 
  Zap,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { BroadcastBanner } from "@/components/game/BroadcastBanner";

export default function Round5Page() {
  const [gameState, setGameState] = useState<any>(null);
  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Memory Leak State
  const [isMemoryLeaked, setIsMemoryLeaked] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);

  // Subscribe to Firebase gameState, aircraftSnapshot, players, and stage5Votes
  useEffect(() => {
    try {
      const gameStateRef = ref(database, "gameState");
      const aircraftRef = ref(database, "gameState/aircraftSnapshot");
      const playersRef = ref(database, "players");
      const votesRef = ref(database, "gameState/stage5Votes");

      const unsubGameState = onValue(gameStateRef, (snapshot) => {
        const val = snapshot.val();
        setGameState(val);
        if (val?.stage5MemoryLeaked !== undefined) {
          setIsMemoryLeaked(Boolean(val.stage5MemoryLeaked));
        }
        setLoading(false);
      });

      const unsubAircraft = onValue(aircraftRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setAircraftSnapshot([]);
          return;
        }
        let parsed: Aircraft[] = [];
        if (Array.isArray(data)) parsed = data.filter(Boolean);
        else if (typeof data === "object") parsed = Object.values(data);
        setAircraftSnapshot(parsed);
      });

      const unsubPlayers = onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        let list: Player[] = [];
        if (Array.isArray(data)) {
          list = data.map((item, index) => ({ id: item?.id ? String(item.id) : `p_${index}`, ...item })).filter(Boolean);
        } else if (typeof data === "object") {
          list = Object.entries(data).map(([k, v]: [string, any]) => ({ id: k, ...v }));
        }
        setPlayers(list.filter((p) => p.status === "alive"));
      });

      const unsubVotes = onValue(votesRef, (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === "object") {
          setVotes(data);
        }
      });

      return () => {
        unsubGameState();
        unsubAircraft();
        unsubPlayers();
        unsubVotes();
      };
    } catch (e) {
      console.error("Firebase Round 5 setup error:", e);
      setLoading(false);
    }
  }, []);

  // 5 Aircraft from snapshot
  const targetAircraft = useMemo(() => {
    if (aircraftSnapshot.length === 0) return [];
    return aircraftSnapshot.slice(0, 5);
  }, [aircraftSnapshot]);

  // Handle SIMULATE MEMORY LEAK
  const handleSimulateMemoryLeak = async () => {
    const nextLeakedState = !isMemoryLeaked;
    setIsMemoryLeaked(nextLeakedState);

    try {
      const leakRef = ref(database, "gameState/stage5MemoryLeaked");
      await set(leakRef, nextLeakedState);
    } catch (err) {
      console.warn("Could not sync stage5MemoryLeaked to Firebase:", err);
    }
  };

  // Cast Vote for Corrupted Player
  const handleCastVote = async (playerId: string) => {
    setMyVote(playerId);
    const nextCount = (votes[playerId] || 0) + 1;

    try {
      const playerVoteRef = ref(database, `gameState/stage5Votes/${playerId}`);
      await set(playerVoteRef, nextCount);
    } catch (err) {
      console.warn("Could not sync vote to Firebase:", err);
    }
  };

  // Identify most voted / suspicious player
  const suspectPlayer = useMemo(() => {
    let topId = null;
    let maxVotes = 0;
    for (const [id, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        topId = id;
      }
    }
    return topId ? players.find((p) => p.id === topId) : null;
  }, [votes, players]);

  return (
    <div className="relative min-h-screen bg-[#06030b] text-[#e6edf3] font-mono selection:bg-red-500 selection:text-white overflow-x-hidden scanlines">
      {/* Background Cyber Interrogation Atmosphere */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-20 z-0" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        
        {/* Global GM Announcement Banner */}
        <BroadcastBanner />

        {/* Top Header */}
        <header className="mb-6 rounded-2xl border border-red-500/40 bg-[#120515]/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <Link
                href="/lobby"
                className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-red-400 text-zinc-400 hover:text-red-300 transition-colors flex items-center justify-center"
                title="Return to Central Lobby"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-red-500/20 text-red-400 border border-red-500/40">
                    STAGE 05 // INTERROGATION
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    MEMORY LEAK PROTOCOL
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-bold ${
                    isMemoryLeaked ? "text-red-400" : "text-emerald-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isMemoryLeaked ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
                    {isMemoryLeaked ? "BUFFER PURGED // VOTING LOCKED" : "MEMORY BUFFER HEALTHY (5 TARGETS)"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-300 to-white mt-1">
                  STAGE 5: MEMORY LEAK INTERROGATION
                </h1>
              </div>
            </div>

            {/* Stage Controls & Simulate Memory Leak Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSimulateMemoryLeak}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
                  isMemoryLeaked
                    ? "bg-zinc-800 border border-zinc-600 hover:border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    : "bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                }`}
              >
                {isMemoryLeaked ? <RefreshCw className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                <span>{isMemoryLeaked ? "RESTORE MEMORY BUFFER" : "⚠️ SIMULATE MEMORY LEAK"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Status Directive Banner */}
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-[#16040d]/80 backdrop-blur-md p-4 sm:p-5 flex items-start gap-3.5 shadow-[0_0_20px_rgba(239,68,68,0.12)]">
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 flex-shrink-0">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-red-400 uppercase">
                {isMemoryLeaked ? "CRITICAL MEMORY OVERFLOW // INTERROGATION IN PROGRESS" : "AIRSPACE CACHE INSPECTION // 5 TARGET BUFFER"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {isMemoryLeaked
                ? "The telemetry buffer has suffered a cataclysmic memory wipe. One operative in the squad has their memory buffer corrupted and is compromised. Interrogate your peers and vote on who possesses the corrupted memory!"
                : "Operatives must memorize the telemetry signatures of the 5 aircraft in the memory buffer below. Once the GM simulates the memory leak, the data will vanish and you must vote to purge the corrupted agent."}
            </p>
          </div>
        </div>

        {/* Conditional View: 5 Aircraft Grid vs Voting Panel */}
        {!isMemoryLeaked ? (
          /* 5 Aircraft Memory Buffer Grid */
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black tracking-widest text-white uppercase">
                  ACTIVE MEMORY BUFFER // 5 AIRSPACE TELEMETRY TARGETS
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                TARGET COUNT: {targetAircraft.length}/5
              </span>
            </div>

            {targetAircraft.length === 0 ? (
              <div className="py-16 rounded-2xl border border-dashed border-zinc-800 text-center p-6 bg-black/40">
                <Radio className="w-10 h-10 mx-auto text-zinc-600 animate-pulse mb-2" />
                <p className="text-sm text-zinc-400 font-bold">NO AIRCRAFT IN MEMORY BUFFER</p>
                <p className="text-xs text-zinc-600 mt-1">Ping airspace in the Lobby to synchronize telemetry targets.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {targetAircraft.map((plane, idx) => (
                  <div
                    key={plane.id || idx}
                    className="relative group rounded-2xl border border-cyan-500/30 bg-[#071324]/90 p-4 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:-translate-y-1 font-mono"
                  >
                    {/* Top Tag & Plane Icon */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-cyan-500/20">
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        SLOT #{idx + 1}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        HEX: {plane.id}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className="text-[10px] text-zinc-500 block leading-tight">CALLSIGN</span>
                      <h4 className="text-base font-black tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                        {plane.callsign || plane.id}
                      </h4>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-800/80">
                        <span className="text-zinc-500 text-[10px]">ALTITUDE:</span>
                        <strong className="text-emerald-400">{plane.altitude} FT</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/80">
                        <span className="text-zinc-500 text-[10px]">SPEED:</span>
                        <strong className="text-amber-400">{plane.speed} KTS</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/80">
                        <span className="text-zinc-500 text-[10px]">TRACK:</span>
                        <strong className="text-purple-300">{plane.track}&deg;</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500 text-[10px]">TYPE:</span>
                        <strong className="text-zinc-300">{plane.type || "N/A"}</strong>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-cyan-500/10 text-[9px] text-zinc-600 text-right">
                      MEM_ADDR: 0x7FFF00{idx * 16}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Corrupted Memory Voting Panel */
          <div className="space-y-6 mb-8">
            
            {/* Corrupted Memory Glitch Header */}
            <div className="p-4 rounded-2xl border-2 border-red-500/80 bg-red-950/60 shadow-[0_0_35px_rgba(239,68,68,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Skull className="w-8 h-8 text-red-400 flex-shrink-0 animate-bounce" />
                <div>
                  <h3 className="text-base font-black tracking-widest text-red-300 uppercase">
                    MEMORY BUFFER CORRUPTED // VOTING FOR ACCUSED AGENT
                  </h3>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Cast your vote below for the operative who holds the corrupted memory signature.
                  </p>
                </div>
              </div>

              {suspectPlayer && (
                <div className="px-4 py-2 rounded-xl bg-black/80 border border-red-500 text-right flex-shrink-0">
                  <span className="text-[10px] font-bold text-red-400 block uppercase">PRIMARY SUSPECT:</span>
                  <span className="text-sm font-black text-white">{suspectPlayer.alias || suspectPlayer.name}</span>
                  <span className="text-[10px] text-amber-300 ml-2">({votes[suspectPlayer.id]} Votes)</span>
                </div>
              )}
            </div>

            {/* Alive Operatives Voting Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" />
                  <h4 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
                    ALIVE OPERATIVES ({players.length} DETECTED)
                  </h4>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {myVote ? "VOTE REGISTERED" : "CLICK A CARD TO CAST VOTE"}
                </span>
              </div>

              {players.length === 0 ? (
                <div className="py-12 rounded-xl border border-dashed border-zinc-800 text-center p-6 bg-black/40">
                  <p className="text-xs text-zinc-500">No alive operatives currently in the /players database.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {players.map((p, idx) => {
                    const voteCount = votes[p.id] || 0;
                    const isMyTarget = myVote === p.id;
                    const isTopSuspect = suspectPlayer?.id === p.id && voteCount > 0;

                    return (
                      <div
                        key={p.id || idx}
                        className={`relative rounded-2xl border p-4 transition-all duration-300 ${
                          isTopSuspect
                            ? "border-red-500 bg-red-950/80 shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-102"
                            : isMyTarget
                            ? "border-amber-400 bg-[#1e0a14] shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            : "border-zinc-800 bg-[#0c0612]/90 hover:border-red-500/50"
                        }`}
                      >
                        {/* Top Info */}
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-zinc-500 text-[10px]">#0{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {p.teamId || "UNAFFILIATED"}
                          </span>
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                            isTopSuspect
                              ? "border-red-500 bg-red-900 text-red-300"
                              : "border-zinc-700 bg-black/40 text-zinc-400"
                          }`}>
                            {p.isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-black text-white truncate font-mono">
                              {p.alias || p.name || `Operative_${p.id.slice(-4)}`}
                            </h5>
                            <span className="text-[10px] text-zinc-500 block">ID: {p.id.slice(0, 8)}</span>
                          </div>
                        </div>

                        {/* Votes Bar */}
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between mb-3">
                          <span className="text-[10px] text-zinc-500">ACCUSATION TALLY:</span>
                          <span className={`text-xs font-black ${voteCount > 0 ? "text-red-400" : "text-zinc-600"}`}>
                            {voteCount} VOTES
                          </span>
                        </div>

                        {/* Vote Button */}
                        <button
                          onClick={() => handleCastVote(p.id)}
                          className={`w-full py-2 px-3 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isMyTarget
                              ? "bg-red-500 text-black shadow-[0_0_12px_#ef4444]"
                              : "bg-zinc-900 hover:bg-red-950 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-500/60"
                          }`}
                        >
                          <Vote className="w-3.5 h-3.5" />
                          <span>{isMyTarget ? "VOTED FOR AGENT" : "VOTE CORRUPTED"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALICE IN HACKERLAND &bull; STAGE 5: MEMORY LEAK PROTOCOL</span>
          <span>BUFFER STATUS: {isMemoryLeaked ? "CORRUPTED" : "ONLINE"}</span>
        </footer>

      </div>
    </div>
  );
}
