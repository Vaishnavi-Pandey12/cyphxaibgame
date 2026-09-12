"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";
import { 
  Waves, 
  Eye, 
  Shield, 
  ArrowLeft, 
  AlertTriangle, 
  Compass, 
  Wind, 
  Activity, 
  RefreshCw, 
  Play, 
  Anchor, 
  Crosshair,
  Sparkles,
  Plane,
  Radar
} from "lucide-react";
import Link from "next/link";
import { BroadcastBanner } from "@/components/game/BroadcastBanner";

export default function Round2Page() {
  const [gameState, setGameState] = useState<any>(null);
  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);

  // Breath & Submersion State
  const [breath, setBreath] = useState<number>(100);
  const [isSubmerged, setIsSubmerged] = useState<boolean>(false);
  const [detectedByJack, setDetectedByJack] = useState<boolean>(false);
  const [survivalTime, setSurvivalTime] = useState<number>(0);

  // Subscribe to Firebase gameState and aircraftSnapshot
  useEffect(() => {
    try {
      const gameStateRef = ref(database, "gameState");
      const aircraftRef = ref(database, "gameState/aircraftSnapshot");

      const unsubGameState = onValue(
        gameStateRef,
        (snapshot) => {
          setGameState(snapshot.val());
          setLoading(false);
        },
        (err) => {
          console.error("Firebase gameState read error:", err);
          setLoading(false);
        }
      );

      const unsubAircraft = onValue(
        aircraftRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            setAircraftSnapshot([]);
            return;
          }

          let parsed: Aircraft[] = [];
          if (Array.isArray(data)) {
            parsed = data.filter(Boolean);
          } else if (typeof data === "object") {
            parsed = Object.values(data);
          }
          setAircraftSnapshot(parsed);
        },
        (err) => {
          console.error("Firebase aircraft snapshot error:", err);
        }
      );

      return () => {
        unsubGameState();
        unsubAircraft();
      };
    } catch (e) {
      console.error("Firebase setup error:", e);
      setLoading(false);
    }
  }, []);

  // Primary Aircraft tracking
  const primaryAircraft = aircraftSnapshot.length > 0 ? aircraftSnapshot[0] : null;

  // Track / Heading degrees for The Jack's Searchlight
  const searchlightTrack = useMemo(() => {
    const rawTrack = primaryAircraft?.track;
    if (typeof rawTrack === "number") return rawTrack;
    const parsed = parseInt(String(rawTrack || "180"), 10);
    return isNaN(parsed) ? 180 : parsed;
  }, [primaryAircraft]);

  // Breath Meter Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSurvivalTime((prev) => prev + 1);

      if (isSubmerged) {
        // Breath drains when underwater
        setBreath((prev) => Math.max(0, prev - 2.5));
      } else {
        // Breath restores when surfaced
        setBreath((prev) => Math.min(100, prev + 5));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmerged]);

  // Check if The Jack's Searchlight sweeps over the operative on the surface
  // For simulation: when surfaced and searchlight aligns (track in certain quadrant or periodic sweep), trigger warning
  useEffect(() => {
    if (!isSubmerged) {
      // Normalized searchlight angle
      const normalized = ((searchlightTrack % 360) + 360) % 360;
      // If beam points towards operative sector (between 120° and 240°) while surfaced
      if (normalized >= 110 && normalized <= 250) {
        setDetectedByJack(true);
      } else {
        setDetectedByJack(false);
      }
    } else {
      setDetectedByJack(false);
    }
  }, [isSubmerged, searchlightTrack]);

  // Breath Bar Color & Warning
  const isBreathLow = breath <= 25;
  const isBreathCritical = breath === 0;

  return (
    <div className="relative min-h-screen bg-[#020612] text-[#e6edf3] font-mono selection:bg-cyan-500 selection:text-black overflow-x-hidden scanlines">
      {/* Dark Lake Water Waves Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#030d1d] via-[#020a16] to-[#01040a] z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(6,182,212,0.08)_0%,transparent_60%)] pointer-events-none z-0" />
      <div className="fixed inset-0 opacity-20 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        
        {/* Global GM Announcement Banner */}
        <BroadcastBanner />

        {/* Top Header */}
        <header className="mb-6 rounded-2xl border border-cyan-500/30 bg-[#071324]/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <Link
                href="/lobby"
                className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-cyan-400 text-zinc-400 hover:text-cyan-300 transition-colors flex items-center justify-center"
                title="Return to Central Lobby"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    STAGE 02 // FISHING
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    DARK LAKE OF HACKER LAND
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-bold ${isSubmerged ? "text-sky-400" : "text-emerald-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${isSubmerged ? "bg-sky-400 animate-pulse" : "bg-emerald-400 animate-ping"}`} />
                    {isSubmerged ? "DEPTH: SUBMERGED (-15M)" : "DEPTH: SURFACED (0M)"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-sky-400 mt-1">
                  STAGE 2: THE DARK LAKE (FISHING)
                </h1>
              </div>
            </div>

            {/* Stage Navigation & Telemetry Quick Info */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-xs text-zinc-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>JACK TRACK:</span>
                <strong className="text-amber-400">{searchlightTrack}&deg;</strong>
              </div>

              <Link
                href="/rounds/round-3"
                className="px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold tracking-wider uppercase transition-all"
              >
                SKIP TO STAGE 3 &gt;&gt;
              </Link>
            </div>
          </div>
        </header>

        {/* The Jack's Searchlight Detection Alert */}
        {detectedByJack && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/80 bg-red-950/70 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.5)] flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-900/80 border border-red-400 text-red-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black tracking-widest uppercase">
                  ⚠️ THE JACK&apos;S SEARCHLIGHT IS LOCKED ONTO YOUR POSITION!
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  You are exposed on the water surface. Submerge immediately to break radar/visual lock.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSubmerged(true)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              SUBMERGE NOW
            </button>
          </div>
        )}

        {/* Critical Breath Warning */}
        {isBreathCritical && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/80 bg-amber-950/70 text-amber-200 flex items-center gap-3 animate-bounce shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-black tracking-wider uppercase">OXYGEN DEPLETED // HYPOXIA DETECTED!</span> Surface now to draw air into your rebreather!
            </div>
          </div>
        )}

        {/* Top Controls Grid: Breath Meter + Surface/Submerge Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Breath Meter Panel (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-cyan-500/30 bg-[#061224]/90 backdrop-blur-md p-5 shadow-[0_0_25px_rgba(0,240,255,0.1)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wind className={`w-5 h-5 ${isBreathLow ? "text-red-400 animate-spin" : "text-cyan-400"}`} />
                <h3 className="text-xs sm:text-sm font-black tracking-widest text-cyan-300 uppercase">
                  REBREATHER // BREATH METER
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-black ${
                  isBreathLow 
                    ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse" 
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}>
                  {Math.round(breath)}% OXYGEN
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {isSubmerged ? "DRAINING (-2.5%/s)" : "RECHARGING (+5%/s)"}
                </span>
              </div>
            </div>

            {/* Breath Meter Progress Bar */}
            <div className="w-full h-5 bg-black/70 rounded-xl overflow-hidden border border-cyan-500/40 p-1 mb-3">
              <div
                className={`h-full rounded-lg transition-all duration-300 shadow-md ${
                  isBreathLow
                    ? "bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                    : "bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(0,240,255,0.7)]"
                }`}
                style={{ width: `${breath}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-cyan-500/20">
              <span>STATUS: <strong className={isSubmerged ? "text-sky-300" : "text-emerald-300"}>{isSubmerged ? "UNDERWATER EVASION" : "SURFACE BREATHING"}</strong></span>
              <span>SURVIVAL CLOCK: <strong className="text-white">{survivalTime}s</strong></span>
            </div>
          </div>

          {/* Surface / Submerge Toggle Control (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-cyan-500/30 bg-[#061224]/90 backdrop-blur-md p-5 shadow-[0_0_25px_rgba(0,240,255,0.1)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black tracking-widest text-zinc-300 uppercase">
                  DIVING CONTROL TERMINAL
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">TOGGLE HYDRAULICS</span>
            </div>

            {/* Main Toggle Button */}
            <button
              onClick={() => setIsSubmerged(!isSubmerged)}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center gap-2.5 ${
                isSubmerged
                  ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-400 text-black hover:opacity-90 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
                  : "bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 text-white border border-cyan-400/40 hover:border-cyan-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95"
              }`}
            >
              {isSubmerged ? (
                <>
                  <Waves className="w-5 h-5 animate-bounce" />
                  <span>SURFACE FOR AIR (0M)</span>
                </>
              ) : (
                <>
                  <Anchor className="w-5 h-5 animate-pulse" />
                  <span>SUBMERGE INTO THE DEEP (-15M)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-400 mt-2 text-center">
              {isSubmerged
                ? "Hidden from The Jack's Searchlight &bull; Consuming rebreather oxygen"
                : "Breathing freely &bull; Vulnerable to overhead sweep of The Jack's beam"}
            </p>
          </div>
        </div>

        {/* Main Dark Lake Simulation & The Jack's Searchlight Visualizer */}
        <div className="rounded-3xl border-2 border-cyan-500/40 bg-[#030917]/95 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative overflow-hidden mb-8">
          
          {/* Water Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-cyan-500/20">
            <div>
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-cyan-400 animate-spin" />
                <h3 className="text-sm sm:text-base font-black tracking-widest text-cyan-300 uppercase">
                  THE JACK&apos;S PATROL RADAR &amp; SEARCHLIGHT
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rotated dynamically in real-time by flight telemetry: <code className="text-cyan-300 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-500/30">aircraft.track = {searchlightTrack}&deg;</code>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-zinc-800 text-zinc-300">
                BEAM ANGLE: <strong className="text-amber-400">{searchlightTrack}&deg;</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                SOURCE: <strong className="text-white">{primaryAircraft?.callsign || "RADAR_CHOPPER"}</strong>
              </span>
            </div>
          </div>

          {/* Interactive Radar Lake Canvas Container */}
          <div className="relative w-full aspect-square max-w-lg mx-auto rounded-full border-2 border-cyan-500/40 bg-[#020a16] flex items-center justify-center overflow-hidden shadow-[inset_0_0_60px_rgba(0,240,255,0.15)]">
            
            {/* Concentric Sonar Rings */}
            <div className="absolute inset-8 rounded-full border border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-32 rounded-full border border-cyan-500/25 pointer-events-none" />
            <div className="absolute inset-44 rounded-full border border-dashed border-cyan-500/30 pointer-events-none" />

            {/* Cardinal Compass Grid Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-cyan-500/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-cyan-500/20" />
            </div>

            {/* Compass Headings */}
            <span className="absolute top-2 text-[10px] font-bold text-cyan-500">000&deg; N</span>
            <span className="absolute bottom-2 text-[10px] font-bold text-cyan-500">180&deg; S</span>
            <span className="absolute right-2 text-[10px] font-bold text-cyan-500">090&deg; E</span>
            <span className="absolute left-2 text-[10px] font-bold text-cyan-500">270&deg; W</span>

            {/* THE JACK'S SEARCHLIGHT BEAM (Rotated by aircraft.track) */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${searchlightTrack}deg)` }}
            >
              {/* Conical Light Beam Sweeping Out from Center */}
              <div 
                className="w-0 h-0 border-l-[70px] border-l-transparent border-r-[70px] border-r-transparent border-b-[240px] border-b-cyan-300/35 filter blur-[3px] -translate-y-28 pointer-events-none drop-shadow-[0_0_25px_rgba(0,240,255,0.8)]"
              />
              {/* Core Hotspot Beam */}
              <div 
                className="absolute w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[220px] border-b-amber-300/40 filter blur-[1px] -translate-y-28 pointer-events-none"
              />
              {/* Beam Centerline Vector */}
              <div className="absolute top-0 bottom-1/2 w-[2px] bg-gradient-to-t from-cyan-400 to-transparent shadow-[0_0_10px_#00f0ff]" />
            </div>

            {/* The Jack's Central Searchlight Tower / Chopper */}
            <div className="relative z-20 w-14 h-14 rounded-full bg-[#0a1b2d] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.6)]">
              <Eye className="w-7 h-7 text-cyan-300 animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-50 pointer-events-none" />
            </div>

            {/* Operative Marker on the Lake Grid */}
            <div 
              className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-500 ${
                isSubmerged ? "opacity-40 scale-75 blur-[1px]" : "opacity-100 scale-100"
              }`}
            >
              <div className={`p-2.5 rounded-full border-2 ${
                detectedByJack 
                  ? "border-red-500 bg-red-950 text-red-400 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.8)]" 
                  : isSubmerged 
                  ? "border-sky-500/50 bg-sky-950/80 text-sky-400" 
                  : "border-emerald-400 bg-emerald-950 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              }`}>
                {isSubmerged ? <Waves className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <span className={`text-[9px] font-black mt-1 px-1.5 py-0.5 rounded ${
                detectedByJack ? "bg-red-500 text-white" : "bg-black/80 text-cyan-300"
              }`}>
                {isSubmerged ? "SUBMERGED" : detectedByJack ? "DETECTED!" : "SURFACED"}
              </span>
            </div>

          </div>

          {/* Under-canvas Simulation Legend */}
          <div className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <span>THE JACK&apos;S SEARCHLIGHT (TRACK: {searchlightTrack}&deg;)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span>OPERATIVE POSITION</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400" />
              <span>DEPTH: {isSubmerged ? "-15M (STEALTH)" : "0M (EXPOSED)"}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALICE IN HACKERLAND &bull; STAGE 2: FISHING PROTOCOL</span>
          <span>AIRSPACE TELEMETRY: {primaryAircraft?.callsign || "LIVE_RADAR"} // TRACK {searchlightTrack}&deg;</span>
        </footer>

      </div>
    </div>
  );
}
