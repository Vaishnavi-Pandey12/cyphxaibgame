"use client";

import React from "react";
import { Bot, User, ShieldCheck, Zap, Radio, Users2 } from "lucide-react";

export interface Player {
  id: string;
  name?: string;
  alias?: string;
  username?: string;
  status: "alive" | "eliminated" | "dead" | string;
  teamId?: string;
  isBot?: boolean;
  avatar?: string;
  role?: string;
  joinedAt?: number | string;
  score?: number;
  ip?: string;
  level?: number;
  [key: string]: any;
}

interface PlayerCardProps {
  player: Player;
  index: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, index }) => {
  const displayName = player.alias || player.name || player.username || `Operative_${player.id.slice(-4)}`;
  const isBot = player.isBot || displayName.toLowerCase().startsWith("bot") || player.role === "bot";
  const formattedIndex = String(index + 1).padStart(2, "0");

  // Determine team badge styling
  const isTeam1 = player.teamId === "Team 1";
  const isTeam2 = player.teamId === "Team 2";

  return (
    <div className={`relative group overflow-hidden rounded-xl border ${
      player.teamId 
        ? isTeam1 
          ? "border-cyan-400/50 bg-gradient-to-b from-[#0a1e2e]/90 to-[#070b14]/90 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          : "border-fuchsia-400/50 bg-gradient-to-b from-[#250d2e]/90 to-[#070b14]/90 shadow-[0_0_15px_rgba(255,0,127,0.15)]"
        : "border-cyan-500/20 bg-gradient-to-b from-[#0e172a]/90 to-[#070b14]/90"
    } p-4 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:-translate-y-1`}>
      {/* Corner decorative accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />

      {/* Top row: Index, Team Badge & Alive Status */}
      <div className="flex items-center justify-between text-xs mb-3 font-mono">
        <span className="text-zinc-500 flex items-center gap-1">
          <span className="text-cyan-400">#</span>
          {formattedIndex}
        </span>

        <div className="flex items-center gap-2">
          {player.teamId && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              isTeam1
                ? "bg-cyan-950/90 border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                : isTeam2
                ? "bg-fuchsia-950/90 border-fuchsia-400/60 text-fuchsia-300 shadow-[0_0_10px_rgba(255,0,127,0.3)]"
                : "bg-amber-950/90 border-amber-400/60 text-amber-300 shadow-[0_0_10px_rgba(255,184,0,0.3)]"
            }`}>
              <Users2 className="w-2.5 h-2.5" />
              {player.teamId}
            </span>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-semibold tracking-wider text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ALIVE
          </div>
        </div>
      </div>

      {/* Center: Avatar & Alias */}
      <div className="flex items-center gap-3">
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-lg border ${
          isBot 
            ? "border-purple-500/40 bg-purple-950/30 text-purple-400 group-hover:border-purple-400" 
            : "border-cyan-500/40 bg-cyan-950/30 text-cyan-400 group-hover:border-cyan-400"
        } transition-colors`}>
          {isBot ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
          
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-cyan-300 transition-colors font-mono">
              {displayName}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isBot ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                <Zap className="w-2.5 h-2.5" /> SYNTH_BOT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                <ShieldCheck className="w-2.5 h-2.5" /> OPERATIVE
              </span>
            )}
            <span className="text-[10px] text-zinc-500 font-mono">
              ID:{player.id.slice(0, 6)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Metadata bar */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span className="flex items-center gap-1 text-zinc-500 text-[10px]">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> SYNCED
        </span>
        <span className="text-zinc-400 text-[10px]">
          {player.teamId ? (
            <span className={isTeam1 ? "text-cyan-400 font-semibold" : isTeam2 ? "text-fuchsia-400 font-semibold" : "text-amber-400"}>
              AFFILIATION: {player.teamId}
            </span>
          ) : (
            <>LATENCY: <span className="text-emerald-400">{Math.floor(Math.random() * 20) + 12}ms</span></>
          )}
        </span>
      </div>
    </div>
  );
};
