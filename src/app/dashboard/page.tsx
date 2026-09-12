"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { STAGES_LIST } from '@/lib/stages';
import { Header } from '@/components/theme/Header';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Aircraft } from '@/lib/airplanes';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [audioActive, setAudioActive] = useState(false);
  const [radioFreq, setRadioFreq] = useState('121.500');

  // Live state from Firebase
  const [players, setPlayers] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [myPlayer, setMyPlayer] = useState<any>(null);

  useEffect(() => {
    // Listen to real players
    const unsubPlayers = onValue(ref(database, "players"), (snap) => {
      const val = snap.val() || {};
      const list = Object.values(val);
      setPlayers(list);
      if (user?.uid && val[user.uid]) {
        setMyPlayer(val[user.uid]);
      }
    });

    // Listen to real game state
    const unsubGame = onValue(ref(database, "gameState"), (snap) => {
      setGameState(snap.val() || {});
    });

    return () => {
      unsubPlayers();
      unsubGame();
    };
  }, [user]);

  const alivePlayers = useMemo(() => players.filter((p) => p.status === "alive"), [players]);
  const activeAircraft: Aircraft | null = gameState?.aircraftSnapshot?.[0] || null;
  const currentStatus = gameState?.status || "waiting";

  const stageLabelMap: Record<string, { code: string; name: string; link: string }> = {
    waiting: { code: "STANDBY", name: "LOBBY GATHERING", link: "/lobby" },
    round1: { code: "STAGE 01", name: "FLIGHT 404", link: "/rounds/round-1" },
    round2: { code: "STAGE 02", name: "FISHING", link: "/rounds/round-2" },
    round3: { code: "STAGE 03", name: "REDLINE", link: "/rounds/round-3" },
    round4: { code: "STAGE 04", name: "SAME PAGE", link: "/rounds/round-4" },
    round5: { code: "STAGE 05", name: "DEJA VU", link: "/rounds/round-5" },
    ended: { code: "COMPLETE", name: "CYCLE FINISHED", link: "/lobby" },
  };

  const activeStage = stageLabelMap[currentStatus] || stageLabelMap.waiting;

  const toggleRadioAudio = () => {
    setAudioActive(!audioActive);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e0e] text-[#e5e2e1] flex flex-col justify-between selection:bg-[#ff544b] selection:text-black overflow-x-hidden font-mono">
      <Header />

      <main className="w-full flex-1 flex flex-col pt-20 sm:pt-24 pb-8 relative z-10 px-3 sm:px-6 lg:px-8 max-w-[1440px] mx-auto select-none">
        <div className="flex flex-col gap-5 sm:gap-6 w-full">
          {/* Top Welcome & Mission Status Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#1c1b1b] p-4 sm:p-5 border border-[#353534] shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-[#ff544b]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col gap-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff544b] animate-ping"></span>
                <span className="font-mono text-[11px] sm:text-xs text-[#ffdad6] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  TOKYO TERMINAL CONTROL // SECTOR 04
                </span>
              </div>

              <h1 className="font-['Cinzel'] text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e5e2e1] tracking-wider uppercase">
                FLIGHT OPERATIONS DASHBOARD
              </h1>

              <p className="font-sans text-xs text-[#af8783] uppercase tracking-wider">
                Active Airspace Crucible — {players.length} Enrolled ({alivePlayers.length} Active Survivors)
              </p>
            </div>

            {/* Tactical Audio Transponder Widget */}
            <div className="flex items-center gap-3 z-10 bg-[#0e0e0e] p-3 border border-[#353534]">
              <button
                onClick={toggleRadioAudio}
                className={`w-10 h-10 flex items-center justify-center text-lg border transition-all cursor-pointer ${
                  audioActive
                    ? 'bg-[#920703] text-white border-[#ff544b] shadow-[0_0_15px_rgba(255,84,75,0.6)]'
                    : 'bg-[#201f1f] text-[#af8783] border-[#353534] hover:text-white'
                }`}
                title="Toggle Transponder Audio"
              >
                {audioActive ? '🔊' : '🔇'}
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#af8783] uppercase">GUARD RADIO FREQ</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#ffdad6]">{radioFreq} MHZ</span>
                  <span className="text-[9px] text-[#ff544b] font-bold">[EMERGENCY]</span>
                </div>
                <span className="text-[9px] text-[#af8783]">{audioActive ? 'AUDIO STREAMING ACTIVE' : 'AUDIO MUTED'}</span>
              </div>
            </div>
          </div>

          {/* 3-Column Status Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Your Candidate Vitals */}
            <div className="bg-[#201f1f] p-4 border border-[#353534] flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#af8783] uppercase font-semibold">YOUR OPERATIVE DOSSIER</span>
                  <span className={`text-xs font-bold ${myPlayer?.status === 'alive' ? 'text-emerald-400' : 'text-[#ff544b]'}`}>
                    {myPlayer?.status === 'alive' ? 'ACTIVE' : user ? 'UNREGISTERED' : 'GUEST'}
                  </span>
                </div>
                <div className="text-lg font-bold text-[#ffdad6] truncate">
                  {user?.displayName || user?.email || 'GUEST OPERATIVE'}
                </div>
                <div className="text-xs text-[#e9bcb7] mt-0.5">
                  SURVIVED: {myPlayer?.survivedRounds || 0} / 5 TRIALS
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#353534]/70 flex items-center justify-between text-xs">
                <span className="text-[#e5e2e1] font-bold">
                  STATUS: <span className={myPlayer?.status === 'alive' ? 'text-emerald-400' : 'text-[#ff544b]'}>
                    {(myPlayer?.status || 'ALIVE').toUpperCase()}
                  </span>
                </span>
                <span className="text-[#af8783] uppercase">SECTOR 04 TOKYO</span>
              </div>
            </div>

            {/* Card 2: Airspace Threat Level */}
            <div className="bg-[#201f1f] p-4 border border-[#353534] flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#af8783] uppercase font-semibold">AIRSPACE STATUS</span>
                  <span className="text-xs text-[#ffdad6] bg-[#93000a] px-2 py-0.5 font-bold uppercase">
                    {currentStatus !== 'waiting' ? 'RESTRICTED' : 'STANDBY'}
                  </span>
                </div>
                <div className="text-lg font-bold text-[#e5e2e1]">
                  FLIGHT {activeAircraft?.callsign || 'SKYNET_SEC04'}
                </div>
                <div className="text-xs text-[#af8783] mt-0.5">
                  ALT {activeAircraft?.altitude ? `${activeAircraft.altitude} FT` : 'CRUISING'} • SPEED {activeAircraft?.speed ? `${activeAircraft.speed} KT` : '---'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#353534]/70 flex items-center justify-between text-xs">
                <span className="text-[#ffb4ab]">SURVIVORS: {alivePlayers.length} OF {players.length || 20}</span>
                <span className="text-[#af8783] uppercase font-bold">AIRSPACE DEFCON 1</span>
              </div>
            </div>

            {/* Card 3: Active Stage Gate */}
            <div className="bg-[#201f1f] p-4 border border-[#353534] flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#af8783] uppercase font-semibold">ACTIVE CRUCIBLE</span>
                  <span className="text-xs text-[#ff544b] font-bold">{activeStage.code}</span>
                </div>
                <div className="text-lg font-bold text-[#ffdad6]">{activeStage.name}</div>
                <div className="text-xs text-[#af8783] mt-0.5">
                  {currentStatus === 'waiting' ? 'WAITING FOR PLAYERS IN LOBBY' : 'SIMULATION ENGAGED'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#353534]/70 flex items-center justify-between">
                <span className="text-xs text-[#e9bcb7]">SECTOR DISPATCH</span>
                <button
                  onClick={() => router.push(activeStage.link)}
                  className="text-xs bg-[#ff544b] text-[#5c0005] font-bold px-3 py-1.5 hover:bg-[#ffb4ab] cursor-pointer transition-colors"
                >
                  ENTER {activeStage.code === 'STANDBY' ? 'LOBBY' : 'TRIAL'} →
                </button>
              </div>
            </div>
          </div>

          {/* 5 Trials Roadmap Deck */}
          <div className="w-full bg-[#1c1b1b] p-4 sm:p-5 border border-[#353534]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-['Cinzel'] text-sm sm:text-base font-bold text-[#ffdad6] uppercase tracking-wider">
                  CRUCIBLE ROADMAP // 5 TRIALS TO SURVIVAL
                </span>
                <p className="text-xs text-[#af8783] font-sans mt-0.5">
                  Clear all 5 successive stages to unlock the sole exfiltration extraction point.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {STAGES_LIST.map((stage) => (
                <div
                  key={stage.id}
                  onClick={() => router.push(`/rounds/round-${stage.stageNumber}`)}
                  className="group bg-[#0e0e0e] border border-[#353534] hover:border-[#ff544b] transition-all p-3 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  <div className="h-28 w-full mb-3 overflow-hidden relative">
                    <img
                      src={stage.imageUrl}
                      alt={stage.name}
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-[#ffdad6] bg-black/80 px-1.5 py-0.5 border border-[#5f3f3b]">
                      {stage.code}
                    </span>
                    <span className="absolute top-1.5 right-1.5 text-sm font-bold text-[#ff544b]">
                      {stage.suitSymbol}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-[#e5e2e1] uppercase group-hover:text-[#ffdad6] block">
                      {stage.name}
                    </span>
                    <span className="text-[10px] text-[#af8783] uppercase block mt-0.5">
                      {stage.trialType}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#353534]/50 flex items-center justify-between text-[10px]">
                    <span className="text-[#ff544b] font-bold">{stage.survivalQuota}</span>
                    <span className="text-[#af8783] group-hover:text-white">TRIAL {stage.stageNumber} &gt;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
