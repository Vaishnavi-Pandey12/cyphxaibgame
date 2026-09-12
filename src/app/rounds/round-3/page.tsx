"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";
import { LaserGrid } from "@/components/game/LaserGrid";
import { 
  Zap, 
  Shield, 
  ArrowLeft, 
  Compass, 
  Gauge, 
  Plane, 
  AlertTriangle, 
  Radio, 
  Activity, 
  CheckCircle2, 
  Cpu, 
  RotateCcw
} from "lucide-react";
import Link from "next/link";

export default function Round3Page() {
  const [gameState, setGameState] = useState<any>(null);
  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
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

  const primaryAircraft = aircraftSnapshot.length > 0 ? aircraftSnapshot[0] : null;

  // Extract speed from primary aircraft
  const rawSpeed = primaryAircraft?.speed ?? 250;
  const speedNumber = useMemo(() => {
    if (typeof rawSpeed === "number") return rawSpeed;
    const parsed = parseInt(String(rawSpeed).replace(/[^0-9]/g, ""), 10);
    return isNaN(parsed) ? 250 : parsed;
  }, [rawSpeed]);

  return (
    <div className="relative min-h-screen bg-[#030611] text-[#e6edf3] font-mono selection:bg-cyan-500 selection:text-black overflow-x-hidden scanlines">
      {/* Background Neon Lasers & Grid */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-25 z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(239,68,68,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed top-0 right-1/4 w-[450px] h-[450px] bg-red-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="mb-6 rounded-2xl border border-red-500/40 bg-[#0c0612]/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-red-500/20 text-red-400 border border-red-500/40">
                    STAGE 03 // LASER GRID
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    SPEED CALIBRATION
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    MATRIX ENGAGED
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-cyan-300 mt-1">
                  STAGE 3: THE QUANTUM LASER GRID
                </h1>
              </div>
            </div>

            {/* Flight Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-red-500/30 text-zinc-300 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-red-400" />
                <span>SPEED:</span>
                <strong className="text-amber-300">{speedNumber} KTS</strong>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-zinc-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>SPEED % 5:</span>
                <strong className="text-cyan-300">INDEX {Math.abs(Math.floor(speedNumber)) % 5}</strong>
              </div>

              <Link
                href="/lobby"
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-cyan-400 text-zinc-300 text-xs transition-colors"
              >
                BACK TO LOBBY
              </Link>
            </div>
          </div>
        </header>

        {/* Stage 3 Directive Banner */}
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-[#14060b]/80 backdrop-blur-md p-4 sm:p-5 flex items-start gap-3.5 shadow-[0_0_20px_rgba(239,68,68,0.12)]">
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-red-400 uppercase">
                LASER MATRIX DIRECTIVE // SPEED CALIBRATION
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              Active lasers shift according to realtime aircraft speed (<code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded border border-zinc-800">{speedNumber} KTS % 5</code>). Red cells contain lethal laser beams that deplete one of your 3 Lives. Safe green cells allow safe passage. Navigate through the matrix!
            </p>
          </div>
        </div>

        {/* 5x5 Laser Grid Interactive Component */}
        <div className="mb-8">
          <LaserGrid speed={speedNumber} />
        </div>

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALICE IN HACKERLAND &bull; STAGE 3: LASER GRID PROTOCOL</span>
          <span>AIRSPACE TELEMETRY: {primaryAircraft?.callsign || "LIVE_RADAR"} // SPEED {speedNumber} KTS</span>
        </footer>

      </div>
    </div>
  );
}
