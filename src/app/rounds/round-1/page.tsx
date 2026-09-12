"use client";

import React, { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { 
  Plane, 
  Shield, 
  Terminal, 
  Radio, 
  AlertTriangle, 
  Crosshair, 
  Users, 
  ArrowLeft, 
  Activity, 
  Compass, 
  Gauge, 
  CheckCircle2, 
  Zap, 
  Lock,
  Radar
} from "lucide-react";
import Link from "next/link";

interface SeatInfo {
  number: number;
  row: number;
  letter: string;
  isExitRow?: boolean;
}

// 20 Cabin Seats arranged across 5 rows (A, B - AISLE - C, D)
const CABIN_SEATS: SeatInfo[] = Array.from({ length: 20 }, (_, idx) => {
  const number = idx + 1;
  const row = Math.floor(idx / 4) + 1;
  const colIndex = idx % 4;
  const letters = ["A", "B", "C", "D"];
  return {
    number,
    row,
    letter: letters[colIndex],
    isExitRow: row === 3, // Row 3 is emergency exit row
  };
});

export default function Round1Page() {
  const [gameState, setGameState] = useState<any>(null);
  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to Firebase gameState & gameState/aircraftSnapshot
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
        (error) => {
          console.error("Firebase gameState read error:", error);
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
        (error) => {
          console.error("Firebase aircraftSnapshot read error:", error);
        }
      );

      return () => {
        unsubGameState();
        unsubAircraft();
      };
    } catch (e) {
      console.error("Failed to initialize Firebase listeners on Round 1:", e);
      setLoading(false);
    }
  }, []);

  // Primary tracked aircraft (Flight 404 or first target in radar snapshot)
  const primaryAircraft = aircraftSnapshot.length > 0 ? aircraftSnapshot[0] : null;

  return (
    <div className="relative min-h-screen bg-[#030712] text-[#e6edf3] font-mono selection:bg-cyan-500 selection:text-black overflow-x-hidden scanlines">
      {/* Background Cyber Grids & Ambient Glow */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-30 z-0" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-0" />
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        
        {/* Top Header & Navigation */}
        <header className="mb-6 rounded-2xl border border-cyan-500/30 bg-[#08111e]/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_25px_rgba(0,240,255,0.12)]">
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    STAGE 01 // ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    FLIGHT 404
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    CABIN PRESSURIZED
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-300 to-white mt-1">
                  FLIGHT 404 // CABIN PROTOCOL
                </h1>
              </div>
            </div>

            {/* Live Flight Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-zinc-300 flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-400" />
                <span>CALLSIGN:</span>
                <strong className="text-cyan-300">
                  {primaryAircraft?.callsign || primaryAircraft?.id || "FLT404"}
                </strong>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-zinc-300 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>ALT:</span>
                <strong className="text-amber-300">
                  {primaryAircraft?.altitude ? `${primaryAircraft.altitude} FT` : "32,000 FT"}
                </strong>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-zinc-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>STAGE NODE:</span>
                <strong className="text-emerald-400">
                  {gameState?.currentStage !== undefined ? `STAGE ${gameState.currentStage}` : "SYNCING"}
                </strong>
              </div>
            </div>
          </div>
        </header>

        {/* Top Grid: Countdown Timer Placeholder & Emergency Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Countdown Timer Placeholder Component */}
          <div className="lg:col-span-1">
            <CountdownTimer
              initialSeconds={240}
              label="STAGE 1 // SEAT LOCKOUT TIMEOUT"
              isPlaceholder={true}
              className="h-full flex flex-col justify-between"
            />
          </div>

          {/* Cabin Directive & Rules Banner */}
          <div className="lg:col-span-2 rounded-2xl border border-amber-500/30 bg-[#120c04]/80 backdrop-blur-md p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
                    CABIN INTRUSION WARNING // STAGE 1
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Operatives aboard Flight 404 must calibrate into an assigned emergency ejection position. Select your designated seat (Seats 1 through 20) in the cabin matrix below before the system override timer expires.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                20 CABIN SLOTS AVAILABLE
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                ROW 3: EMERGENCY WING EXIT
              </span>
              <span className="text-cyan-300 font-bold">
                {selectedSeat ? `CURRENT SELECTION: SEAT #${selectedSeat}` : "CLICK A SEAT TO ENGAGE"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Cabin Fuselage Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
          
          {/* Airplane Cabin Frame (8 Cols on large screens) */}
          <div className="lg:col-span-8 rounded-3xl border-2 border-cyan-500/40 bg-[#050c18]/95 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative">
            
            {/* Cockpit Nose Dome */}
            <div className="relative mx-auto max-w-sm mb-8 pb-4 border-b border-cyan-500/30 flex flex-col items-center text-center">
              <div className="w-32 h-14 rounded-t-full border-t-2 border-x-2 border-cyan-400/60 bg-gradient-to-b from-cyan-950/60 to-transparent flex items-center justify-center shadow-[0_-5px_15px_rgba(0,240,255,0.2)]">
                <Plane className="w-6 h-6 text-cyan-400 -rotate-90" />
              </div>
              <div className="text-[11px] font-black tracking-widest text-cyan-300 mt-2 uppercase">
                COCKPIT // FLIGHT CONTROL TERMINAL
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                <span>AUTOPILOT: <strong className="text-emerald-400">ENGAGED</strong></span>
                <span>&bull;</span>
                <span>RADAR TARGETS: <strong className="text-cyan-400">{aircraftSnapshot.length}</strong></span>
              </div>
            </div>

            {/* Left/Right Fuselage Structural Marks */}
            <div className="absolute left-3 top-28 bottom-28 w-1 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent rounded-full pointer-events-none" />
            <div className="absolute right-3 top-28 bottom-28 w-1 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent rounded-full pointer-events-none" />

            {/* Column Identifiers (A, B - AISLE - C, D) */}
            <div className="grid grid-cols-5 gap-3 max-w-xl mx-auto mb-3 text-center text-xs font-bold text-zinc-500">
              <div>COL A</div>
              <div>COL B</div>
              <div className="text-cyan-500 text-[10px] tracking-wider flex items-center justify-center">
                AISLE
              </div>
              <div>COL C</div>
              <div>COL D</div>
            </div>

            {/* 20 Selectable Seats Matrix (5 Rows) */}
            <div className="space-y-4 max-w-xl mx-auto">
              {[1, 2, 3, 4, 5].map((rowNum) => {
                const rowSeats = CABIN_SEATS.filter((s) => s.row === rowNum);
                const seatA = rowSeats.find((s) => s.letter === "A");
                const seatB = rowSeats.find((s) => s.letter === "B");
                const seatC = rowSeats.find((s) => s.letter === "C");
                const seatD = rowSeats.find((s) => s.letter === "D");
                const isExit = rowNum === 3;

                return (
                  <div key={`row-${rowNum}`} className="relative">
                    {/* Emergency Exit Row Accent */}
                    {isExit && (
                      <div className="absolute -left-6 -right-6 top-1/2 -translate-y-1/2 h-14 bg-amber-500/5 border-y border-dashed border-amber-500/30 -z-0 rounded flex items-center justify-between px-2 text-[9px] font-bold text-amber-500/80">
                        <span>EXIT &lt;&lt;</span>
                        <span>&gt;&gt; EXIT</span>
                      </div>
                    )}

                    <div className="grid grid-cols-5 gap-3 items-center relative z-10">
                      
                      {/* Port Seats (A & B) */}
                      {[seatA, seatB].map((seat) => {
                        if (!seat) return <div key="empty-left" />;
                        const isSelected = selectedSeat === seat.number;
                        return (
                          <button
                            key={seat.number}
                            onClick={() => setSelectedSeat(seat.number === selectedSeat ? null : seat.number)}
                            className={`group relative rounded-xl border p-3 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-950/90 shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-105"
                                : "border-zinc-800 bg-[#070e1a]/90 hover:border-cyan-500/60 hover:bg-[#0a1628]"
                            }`}
                          >
                            <span className="text-[10px] text-zinc-500 font-mono group-hover:text-cyan-400">
                              {seat.row}{seat.letter}
                            </span>
                            <div className={`my-1 p-2 rounded-lg transition-colors ${
                              isSelected 
                                ? "bg-cyan-500 text-black shadow-[0_0_10px_#00f0ff]" 
                                : "bg-black/40 text-cyan-400 group-hover:text-white"
                            }`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-black tracking-wider font-mono ${
                              isSelected ? "text-cyan-300" : "text-zinc-300"
                            }`}>
                              #{seat.number}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-black animate-ping" />
                            )}
                          </button>
                        );
                      })}

                      {/* Center Cabin Aisle */}
                      <div className="flex flex-col items-center justify-center py-2 text-zinc-600 text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-black/40 border border-zinc-800/80">
                          R{rowNum}
                        </span>
                        <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-zinc-700 to-transparent my-1" />
                      </div>

                      {/* Starboard Seats (C & D) */}
                      {[seatC, seatD].map((seat) => {
                        if (!seat) return <div key="empty-right" />;
                        const isSelected = selectedSeat === seat.number;
                        return (
                          <button
                            key={seat.number}
                            onClick={() => setSelectedSeat(seat.number === selectedSeat ? null : seat.number)}
                            className={`group relative rounded-xl border p-3 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-950/90 shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-105"
                                : "border-zinc-800 bg-[#070e1a]/90 hover:border-cyan-500/60 hover:bg-[#0a1628]"
                            }`}
                          >
                            <span className="text-[10px] text-zinc-500 font-mono group-hover:text-cyan-400">
                              {seat.row}{seat.letter}
                            </span>
                            <div className={`my-1 p-2 rounded-lg transition-colors ${
                              isSelected 
                                ? "bg-cyan-500 text-black shadow-[0_0_10px_#00f0ff]" 
                                : "bg-black/40 text-cyan-400 group-hover:text-white"
                            }`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-black tracking-wider font-mono ${
                              isSelected ? "text-cyan-300" : "text-zinc-300"
                            }`}>
                              #{seat.number}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-black animate-ping" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cabin Tail Section */}
            <div className="mt-8 pt-6 border-t border-cyan-500/30 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>CAPACITY: 20 OPERATIVE SEATS</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>EJECTION INTERFACE ONLINE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Seat Inspector & Telemetry Subpanel (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Selected Seat Telemetry Card */}
            <div className="rounded-2xl border border-cyan-500/40 bg-[#081220]/95 backdrop-blur-md p-5 shadow-[0_0_25px_rgba(0,240,255,0.12)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black tracking-widest text-cyan-300 uppercase">
                    SEAT TELEMETRY INSPECTOR
                  </h3>
                </div>
                {selectedSeat ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    SEAT ENGAGED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                    STANDBY
                  </span>
                )}
              </div>

              {selectedSeat ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">SELECTED CABIN POSITION</span>
                      <span className="text-2xl font-black text-cyan-300 tracking-wider">
                        SEAT #{selectedSeat}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">GRID COORDINATES</span>
                      <span className="text-sm font-bold text-white">
                        {CABIN_SEATS[selectedSeat - 1]?.row}
                        {CABIN_SEATS[selectedSeat - 1]?.letter}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-500">CABIN ZONE:</span>
                      <span className="text-zinc-300">
                        {CABIN_SEATS[selectedSeat - 1]?.row <= 2 ? "FORWARD CABIN" : "MID CABIN"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-500">WING PROXIMITY:</span>
                      <span className="text-zinc-300">
                        {CABIN_SEATS[selectedSeat - 1]?.isExitRow ? (
                          <strong className="text-amber-400">EMERGENCY EXIT ROW</strong>
                        ) : (
                          "STANDARD SECTION"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-500">EJECTION HARNESS:</span>
                      <span className="text-emerald-400 font-bold">LOCKED & ARMED</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">OXYGEN DISPENSER:</span>
                      <span className="text-cyan-400 font-bold">ACTIVE (100%)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSeat(null)}
                    className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-300 text-xs font-mono transition-colors"
                  >
                    RELEASE SELECTION
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <Shield className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
                  <p className="text-xs font-bold text-zinc-400">NO SEAT SELECTED</p>
                  <p className="text-[11px] text-zinc-600 mt-1 max-w-xs mx-auto">
                    Click any numbered seat in the cabin diagram (Seats 1-20) to engage telemetry and inspect parameters.
                  </p>
                </div>
              )}
            </div>

            {/* Live Airspace Snapshot Telemetry Widget */}
            <div className="rounded-2xl border border-zinc-800 bg-[#070e1a]/80 p-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] font-bold text-zinc-300">AIRSPACE RADAR LINK</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">RTDB SYNCED</span>
              </div>

              {primaryAircraft ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">LEAD CALLSIGN:</span>
                    <span className="text-cyan-300 font-bold">{primaryAircraft.callsign}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">ALTITUDE:</span>
                    <span className="text-emerald-400">{primaryAircraft.altitude} FT</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">GROUND SPEED:</span>
                    <span className="text-amber-400">{primaryAircraft.speed} KTS</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">HEADING TRACK:</span>
                    <span className="text-purple-300">{primaryAircraft.track}&deg;</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-zinc-600 text-[11px]">
                  <span>NO AIRCRAFT SNAPSHOT DETECTED</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FLIGHT 404 CABIN SIMULATOR &bull; STAGE 1 PROTOCOL</span>
          <span>AIRSPACE NODE: {primaryAircraft?.callsign || "DISCONNECTED"}</span>
        </footer>

      </div>
    </div>
  );
}
