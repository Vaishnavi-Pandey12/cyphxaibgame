"use client";

import React, { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, set, update, get } from "firebase/database";
import { Player } from "@/components/game/PlayerCard";
import { 
  syncAirspaceToFirebase, 
  syncDemoAirspaceToFirebase, 
  DEMO_AIRCRAFT_SNAPSHOT 
} from "@/lib/airplanes";
import { 
  Cpu, 
  Radio, 
  Shield, 
  Skull, 
  Flame, 
  Sparkles, 
  Megaphone, 
  Send, 
  Trash2, 
  RefreshCw, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Heart, 
  Bot, 
  User, 
  Server, 
  Globe, 
  HardDrive,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STAGES = [
  { stage: 0, name: "STAGE 0: LOBBY", desc: "Central Node & Registration", path: "/lobby", color: "cyan" },
  { stage: 1, name: "STAGE 1: FLIGHT 404", desc: "Cabin Survival & Altitude Anchor", path: "/rounds/round-1", color: "amber" },
  { stage: 2, name: "STAGE 2: FISHING", desc: "Dark Lake & The Jack's Searchlight", path: "/rounds/round-2", color: "teal" },
  { stage: 3, name: "STAGE 3: LASER GRID", desc: "5x5 Matrix & Speed Calibration", path: "/rounds/round-3", color: "red" },
  { stage: 4, name: "STAGE 4: PLANE", desc: "Team Trust & Blind Transmission", path: "/rounds/round-4", color: "fuchsia" },
  { stage: 5, name: "STAGE 5: MEMORY LEAK", desc: "Interrogation & Accusation Voting", path: "/rounds/round-5", color: "purple" },
];

const BROADCAST_PRESETS = [
  "⚠️ ALL OPERATIVES: PREPARE FOR SUDDEN CABIN DEPRESSURIZATION!",
  "⚠️ THE JACK'S RADAR SEARCHLIGHT HAS ENTERED YOUR SECTOR. TAKE COVER!",
  "⚠️ QUANTUM LASER MATRIX VOLTAGE AT 100%. NAVIGATE SAFE CELLS ONLY.",
  "⚠️ SQUAD TRUST PROTOCOL INITIATED. MAINTAIN ABSOLUTE UNANIMITY.",
  "⚠️ MEMORY CACHE PURGED. ACCUSATION VOTING COMMENCES IMMEDIATELY.",
];

interface AdminPanelProps {
  className?: string;
  onClose?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ className = "", onClose }) => {
  const router = useRouter();

  // Firebase Realtime State
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [dataSource, setDataSource] = useState<"live" | "demo">("live");
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<string | null>(null);
  const [aircraftCount, setAircraftCount] = useState<number>(0);

  // Local Form / Action States
  const [broadcastInput, setBroadcastInput] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isTogglingSource, setIsTogglingSource] = useState(false);
  const [isSwitchingStage, setIsSwitchingStage] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    try {
      const stageRef = ref(database, "gameState/currentStage");
      const sourceRef = ref(database, "gameState/dataSource");
      const playersRef = ref(database, "players");
      const broadcastRef = ref(database, "gameState/broadcast");
      const aircraftRef = ref(database, "gameState/aircraftSnapshot");

      const unsubStage = onValue(stageRef, (snapshot) => {
        const val = snapshot.val();
        setCurrentStage(typeof val === "number" ? val : val ? Number(val) : 0);
      });

      const unsubSource = onValue(sourceRef, (snapshot) => {
        const val = snapshot.val();
        setDataSource(val === "demo" ? "demo" : "live");
      });

      const unsubPlayers = onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setPlayers([]);
          return;
        }
        let list: Player[] = [];
        if (Array.isArray(data)) {
          list = data.map((item, index) => ({ id: item?.id ? String(item.id) : `p_${index}`, ...item })).filter(Boolean);
        } else if (typeof data === "object") {
          list = Object.entries(data).map(([k, v]: [string, any]) => ({ id: k, ...v }));
        }
        setPlayers(list);
      });

      const unsubBroadcast = onValue(broadcastRef, (snapshot) => {
        const val = snapshot.val();
        if (typeof val === "string") {
          setActiveBroadcast(val);
        } else if (val && typeof val === "object" && val.message) {
          setActiveBroadcast(val.message);
        } else {
          setActiveBroadcast(null);
        }
      });

      const unsubAircraft = onValue(aircraftRef, (snapshot) => {
        const data = snapshot.val();
        if (Array.isArray(data)) {
          setAircraftCount(data.length);
        } else if (data && typeof data === "object") {
          setAircraftCount(Object.keys(data).length);
        } else {
          setAircraftCount(0);
        }
      });

      return () => {
        unsubStage();
        unsubSource();
        unsubPlayers();
        unsubBroadcast();
        unsubAircraft();
      };
    } catch (e) {
      console.error("AdminPanel subscription error:", e);
    }
  }, []);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // 1. Stage Navigation Jump
  const handleJumpStage = async (stageNum: number, path: string) => {
    setIsSwitchingStage(true);
    try {
      const stageRef = ref(database, "gameState/currentStage");
      await set(stageRef, stageNum);
      showFeedback(`STAGE UPDATED: gameState/currentStage set to ${stageNum}. Routing to ${path}...`);
      router.push(path);
    } catch (err: any) {
      console.error("Failed to jump stage:", err);
      showFeedback(`ERROR: ${err.message || "Failed to switch stage"}`);
    } finally {
      setIsSwitchingStage(false);
    }
  };

  // 2. Data Source Toggle (LIVE vs DEMO REPLAY)
  const handleToggleDataSource = async (newSource: "live" | "demo") => {
    setIsTogglingSource(true);
    try {
      if (newSource === "demo") {
        await syncDemoAirspaceToFirebase();
        showFeedback(`DEMO MODE ACTIVE: Loaded ${DEMO_AIRCRAFT_SNAPSHOT.length} safe fallback targets into gameState/aircraftSnapshot.`);
      } else {
        const result = await syncAirspaceToFirebase(40.7128, -74.0060, 50);
        const sourceRef = ref(database, "gameState/dataSource");
        await set(sourceRef, "live");
        showFeedback(`LIVE FEED ACTIVE: Intercepted ${result.count} live aircraft targets from ADSB.LOL proxy.`);
      }
    } catch (err: any) {
      console.error("Failed to toggle data source:", err);
      showFeedback(`DATA SOURCE ERROR: ${err.message || "Toggle failed"}`);
    } finally {
      setIsTogglingSource(false);
    }
  };

  // 3. Operative Execution: EXECUTE DELETE (for dramatic pitch effect)
  const handleExecuteDelete = async (player: Player) => {
    setDeletingId(player.id);
    try {
      const playerStatusRef = ref(database, `players/${player.id}/status`);
      await set(playerStatusRef, "deleted");
      showFeedback(`💥 EXECUTE DELETE: Operative ${player.alias || player.name || player.id} status changed to DELETED!`);
    } catch (err: any) {
      console.error("Failed to execute delete:", err);
      showFeedback(`DELETE ERROR: ${err.message || "Failed to delete player"}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Operative Revive Action
  const handleRevivePlayer = async (player: Player) => {
    try {
      const playerStatusRef = ref(database, `players/${player.id}/status`);
      await set(playerStatusRef, "alive");
      showFeedback(`✨ REVIVED: Operative ${player.alias || player.name || player.id} status restored to ALIVE.`);
    } catch (err: any) {
      console.error("Failed to revive player:", err);
    }
  };

  // 4. Global Broadcast Push
  const handlePushBroadcast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!broadcastInput.trim()) return;

    setIsBroadcasting(true);
    try {
      const msg = broadcastInput.trim();
      const broadcastRef = ref(database, "gameState/broadcast");
      await set(broadcastRef, {
        message: msg,
        timestamp: Date.now(),
        active: true,
      });
      setBroadcastInput("");
      showFeedback("📢 BROADCAST TRANSMITTED: Pushed neon alert across all player screens.");
    } catch (err: any) {
      console.error("Failed to push broadcast:", err);
      showFeedback(`BROADCAST ERROR: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Clear Broadcast
  const handleClearBroadcast = async () => {
    try {
      const broadcastRef = ref(database, "gameState/broadcast");
      await set(broadcastRef, null);
      showFeedback("BROADCAST CLEARED: Screen alerts dismissed.");
    } catch (err: any) {
      console.error("Failed to clear broadcast:", err);
    }
  };

  return (
    <div
      className={`rounded-3xl border-2 border-purple-500/50 bg-[#090514]/98 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(168,85,247,0.3)] font-mono text-zinc-300 relative overflow-hidden ${className}`}
    >
      {/* Top Cyber Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 via-cyan-400 to-emerald-400 animate-pulse" />

      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/90 border border-purple-400/60 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-purple-500 text-black uppercase">
                OVERSEER PRIVILEGES
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                STAGE {currentStage} ACTIVE
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                FIREBASE RTDB
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 mt-0.5">
              MASTER GAME MASTER CONTROL CONSOLE
            </h2>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-500 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        )}
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="mb-6 p-3 rounded-xl bg-purple-950/80 border border-purple-500/60 text-purple-200 text-xs font-mono flex items-center gap-2 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <Sparkles className="w-4 h-4 text-purple-300 flex-shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* SECTION 1: GLOBAL STAGE NAVIGATION GRID (0 to 5) */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
              GLOBAL STAGE NAVIGATION GRID (INSTANT JUMP)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500">
            CURRENT: <strong className="text-cyan-400 font-mono">STAGE {currentStage}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((st) => {
            const isActive = currentStage === st.stage;
            return (
              <button
                key={`stage-${st.stage}`}
                onClick={() => handleJumpStage(st.stage, st.path)}
                disabled={isSwitchingStage}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                  isActive
                    ? "border-cyan-400 bg-cyan-950/80 shadow-[0_0_25px_rgba(0,240,255,0.4)] scale-102"
                    : "border-zinc-800 bg-[#0d071b]/80 hover:border-purple-500/60 hover:bg-[#150a28]"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-black animate-ping" />
                )}
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 font-mono block">
                    STAGE // 0{st.stage}
                  </span>
                  <h4 className={`text-xs font-black tracking-wide mt-1 leading-tight ${
                    isActive ? "text-cyan-300" : "text-white group-hover:text-purple-300"
                  }`}>
                    {st.name.replace(/STAGE \d:\s*/, "")}
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                  <span className={isActive ? "text-cyan-400 font-bold" : "text-zinc-500"}>
                    {isActive ? "ACTIVE NODE" : "DEPLOY"}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 & SECTION 4: DATA SOURCE TOGGLE & BROADCAST ANNOUNCEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-7">
        
        {/* SECTION 2: DATA SOURCE TOGGLE (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-purple-500/30 bg-[#0c061a]/80 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black tracking-wider text-white uppercase">
                  DATA SOURCE CONTROLLER
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                dataSource === "live" 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}>
                {dataSource === "live" ? "ONLINE PROXY" : "OFFLINE REPLAY"}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Toggle between real-time airspace scraping or a safe hardcoded fallback snapshot for offline demos.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleToggleDataSource("live")}
                disabled={isTogglingSource}
                className={`py-3 px-3 rounded-xl border text-xs font-black tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  dataSource === "live"
                    ? "border-emerald-400 bg-emerald-950/80 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>LIVE AIRSPACE</span>
                <span className="text-[9px] font-normal text-zinc-400 font-mono">(ADSB.LOL PROXY)</span>
              </button>

              <button
                onClick={() => handleToggleDataSource("demo")}
                disabled={isTogglingSource}
                className={`py-3 px-3 rounded-xl border text-xs font-black tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  dataSource === "demo"
                    ? "border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>DEMO REPLAY</span>
                <span className="text-[9px] font-normal text-zinc-400 font-mono">(SAFE FALLBACK)</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>SNAPSHOT TARGETS: <strong className="text-cyan-400">{aircraftCount} AIRCRAFT</strong></span>
            <span>STATUS: <strong className="text-emerald-400">SYNCED</strong></span>
          </div>
        </div>

        {/* SECTION 4: GLOBAL BROADCAST ANNOUNCEMENT INPUT (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-purple-500/30 bg-[#0c061a]/80 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-pink-400 animate-pulse" />
                <h3 className="text-xs font-black tracking-wider text-white uppercase">
                  GLOBAL NEON BROADCAST TRANSMITTER
                </h3>
              </div>
              {activeBroadcast && (
                <button
                  onClick={handleClearBroadcast}
                  className="text-[10px] text-red-400 hover:text-red-300 underline font-mono cursor-pointer"
                >
                  DISMISS ACTIVE
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Broadcast high-priority neon messages that flash on every connected player screen in real-time.
            </p>

            {/* Active Broadcast Indicator */}
            {activeBroadcast && (
              <div className="mb-3 p-2.5 rounded-xl bg-pink-950/60 border border-pink-500/50 text-pink-200 text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-pulse">
                <AlertTriangle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <div className="truncate flex-1">
                  <span className="font-black text-pink-300">LIVE SCREEN MSG: </span>
                  <span>{activeBroadcast}</span>
                </div>
              </div>
            )}

            {/* Form Input */}
            <form onSubmit={handlePushBroadcast} className="flex gap-2 mb-3">
              <input
                type="text"
                value={broadcastInput}
                onChange={(e) => setBroadcastInput(e.target.value)}
                placeholder="Type emergency announcement for all player HUDs..."
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-black/70 border border-purple-500/40 text-xs font-mono text-white focus:outline-none focus:border-pink-400 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={isBroadcasting || !broadcastInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>PUSH</span>
              </button>
            </form>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-500">PRESETS:</span>
              {BROADCAST_PRESETS.slice(0, 3).map((preset, idx) => (
                <button
                  key={`preset-${idx}`}
                  type="button"
                  onClick={() => setBroadcastInput(preset)}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-purple-400 text-[10px] text-zinc-400 hover:text-white transition-colors truncate max-w-[200px] cursor-pointer"
                >
                  {preset.slice(0, 28)}...
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: OPERATIVE OVERVIEW LIST WITH 'EXECUTE DELETE' */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
              OPERATIVE ROSTER &amp; DRAMATIC EXECUTION ENGINE
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            TOTAL OPERATIVES: <strong className="text-white">{players.length}</strong> &bull; ALIVE: <strong className="text-emerald-400">{players.filter((p) => p.status === "alive").length}</strong>
          </span>
        </div>

        {players.length === 0 ? (
          <div className="py-10 rounded-2xl border border-dashed border-zinc-800 text-center bg-black/40 text-zinc-500 text-xs">
            No operatives detected in the /players database. Use &quot;FILL TO 20 BOTS&quot; in the lobby dev console to inject operatives.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-purple-500/30 bg-black/50">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-purple-950/60 text-purple-300 border-b border-purple-500/30 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Operative</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Affiliation</th>
                  <th className="py-2.5 px-3">Lives</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Pitch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {players.map((p, idx) => {
                  const isAlive = p.status === "alive";
                  const isDeletingThis = deletingId === p.id;
                  const isTeam1 = p.teamId === "Team 1";
                  const isTeam2 = p.teamId === "Team 2";

                  return (
                    <tr
                      key={p.id || idx}
                      className={`transition-colors ${
                        !isAlive 
                          ? "bg-red-950/20 text-zinc-500" 
                          : "hover:bg-purple-500/10"
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="py-2.5 px-3 font-bold">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                            !isAlive 
                              ? "border-red-500/50 bg-red-950/60 text-red-400" 
                              : p.isBot 
                              ? "border-purple-500/40 bg-purple-950/40 text-purple-300" 
                              : "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                          }`}>
                            {!isAlive ? <Skull className="w-4 h-4" /> : p.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className={!isAlive ? "line-through text-red-300" : "text-white"}>
                              {p.alias || p.name || `Operative_${p.id.slice(-4)}`}
                            </span>
                            <span className="block text-[9px] text-zinc-500 font-mono">
                              ID: {p.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          p.isBot 
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        }`}>
                          {p.isBot ? "SYNTH_BOT" : "HUMAN"}
                        </span>
                      </td>

                      {/* Team Assignment */}
                      <td className="py-2.5 px-3 text-[10px]">
                        {p.teamId ? (
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            isTeam1 
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40" 
                              : isTeam2 
                              ? "bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/40" 
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {p.teamId}
                          </span>
                        ) : (
                          <span className="text-zinc-600">UNASSIGNED</span>
                        )}
                      </td>

                      {/* Lives */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((hIdx) => (
                            <Heart
                              key={hIdx}
                              className={`w-3.5 h-3.5 ${
                                isAlive 
                                  ? "fill-red-500 text-red-400" 
                                  : "fill-zinc-800 text-zinc-700"
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isAlive
                            ? "bg-emerald-950/90 border border-emerald-500/50 text-emerald-400"
                            : "bg-red-950/90 border border-red-500/60 text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAlive ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
                          {isAlive ? "ALIVE" : "DELETED"}
                        </span>
                      </td>

                      {/* Pitch Execution Action */}
                      <td className="py-2.5 px-3 text-right">
                        {isAlive ? (
                          <button
                            onClick={() => handleExecuteDelete(p)}
                            disabled={isDeletingThis}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(239,68,68,0.5)] cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 ml-auto"
                            title="Execute dramatic elimination for live pitch"
                          >
                            {isDeletingThis ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Skull className="w-3 h-3" />
                            )}
                            <span>EXECUTE DELETE</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevivePlayer(p)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-400 text-zinc-400 hover:text-emerald-300 text-[10px] font-mono transition-colors cursor-pointer ml-auto"
                            title="Restore operative to ALIVE status"
                          >
                            REVIVE
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminPanel;
