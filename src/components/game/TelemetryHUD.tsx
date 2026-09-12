"use client";

import React, { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";
import { 
  Radar, 
  Compass, 
  Gauge, 
  ArrowUpRight, 
  Navigation, 
  Plane, 
  Activity, 
  Radio, 
  Crosshair
} from "lucide-react";

interface TelemetryHUDProps {
  className?: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ className = "" }) => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  useEffect(() => {
    try {
      const snapshotRef = ref(database, "gameState/aircraftSnapshot");

      const unsubscribe = onValue(
        snapshotRef,
        (snapshot) => {
          setLoading(false);
          const data = snapshot.val();

          if (!data) {
            setAircraftList([]);
            return;
          }

          let parsed: Aircraft[] = [];
          if (Array.isArray(data)) {
            parsed = data.filter(Boolean);
          } else if (typeof data === "object") {
            parsed = Object.values(data);
          }

          setAircraftList(parsed);
          setLastSyncTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
        },
        (error) => {
          console.error("TelemetryHUD error subscribing to snapshot:", error);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error("Failed to setup TelemetryHUD listener:", err);
      setLoading(false);
    }
  }, []);

  // Format compass heading
  const getCompassDirection = (deg: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  // Format altitude cleanly
  const formatAltitude = (alt: number | string | undefined) => {
    if (alt === undefined || alt === null) return "N/A";
    if (typeof alt === "number") {
      return `${alt.toLocaleString()} FT`;
    }
    return `${alt} FT`;
  };

  return (
    <div
      className={`relative rounded-2xl border border-cyan-500/40 bg-[#060e1a]/95 backdrop-blur-xl p-5 shadow-[0_0_30px_rgba(0,240,255,0.15)] font-mono text-cyan-300 overflow-hidden ${className}`}
    >
      {/* HUD Background Grid & Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff]" />

      {/* HUD Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Radar className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-200">
                AIRSPACE TELEMETRY // HUD
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                RTDB SNAPSHOT
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>TARGETS TRACKED: <strong className="text-emerald-400">{aircraftList.length}</strong></span>
              {lastSyncTime && (
                <span className="text-zinc-500">&bull; SYNC: <span className="text-cyan-400">{lastSyncTime}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* HUD Controls / Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>RADAR ACTIVE</span>
          </div>

          {aircraftList.length > 0 && (
            <div className="flex rounded-lg border border-cyan-500/30 overflow-hidden bg-black/40 text-[10px]">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1 transition-colors ${
                  viewMode === "grid" ? "bg-cyan-500/30 text-cyan-200 font-bold" : "text-zinc-400 hover:text-cyan-300"
                }`}
              >
                GRID
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`px-2.5 py-1 transition-colors ${
                  viewMode === "compact" ? "bg-cyan-500/30 text-cyan-200 font-bold" : "text-zinc-400 hover:text-cyan-300"
                }`}
              >
                COMPACT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrolling Ticker Strip when targets are detected */}
      {aircraftList.length > 0 && (
        <div className="relative z-10 mb-4 overflow-hidden rounded-lg bg-black/60 border border-cyan-500/20 py-1.5 px-3">
          <div className="flex items-center gap-3 text-[11px] font-mono whitespace-nowrap overflow-x-auto scrollbar-none">
            <span className="flex items-center gap-1 text-cyan-400 font-bold uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 flex-shrink-0">
              <Activity className="w-3 h-3 text-emerald-400" /> LIVE FEED
            </span>
            {aircraftList.slice(0, 10).map((ac, idx) => (
              <span key={ac.id || idx} className="text-zinc-300 flex items-center gap-1.5 flex-shrink-0">
                <span className="text-cyan-400 font-bold">{ac.callsign || ac.id}</span>
                <span className="text-emerald-400">{formatAltitude(ac.altitude)}</span>
                <span className="text-zinc-600">|</span>
                <span className="text-amber-300">{ac.speed ?? 0} KTS</span>
                <span className="text-zinc-600">|</span>
                <span className="text-purple-300">{ac.track ?? 0}&deg; {getCompassDirection(ac.track ?? 0)}</span>
                {idx < Math.min(aircraftList.length - 1, 9) && (
                  <span className="text-zinc-700 mx-1">&bull;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main HUD Body */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Radio className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
            <span className="text-xs text-cyan-300 tracking-wider">CONNECTING TO RADAR TELEMETRY STREAM...</span>
          </div>
        ) : aircraftList.length === 0 ? (
          /* Graceful Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-cyan-500/30 bg-black/40 text-center">
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-950/20">
                <Crosshair className="w-7 h-7 text-emerald-400/70 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" />
            </div>

            <h4 className="text-base sm:text-lg font-black tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(0,255,102,0.5)]">
              NO TARGETS DETECTED
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mt-1 mb-2">
              Airspace radar sweep is currently clear or no snapshot has been written to <code className="text-cyan-300 bg-cyan-950/60 px-1 py-0.5 rounded border border-cyan-500/30 text-[10px]">gameState/aircraftSnapshot</code>.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900/80 border border-zinc-700 text-[11px] text-zinc-400">
              <span className="text-amber-400 font-bold">&gt;&gt;</span>
              <span>Trigger &quot;PING AIRSPACE&quot; in the Game Master terminal below to synchronize live flight targets.</span>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* Cyberpunk Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {aircraftList.map((plane, index) => {
              const callsign = plane.callsign || plane.id || `AC_${index + 1}`;
              const trackDeg = typeof plane.track === "number" ? plane.track : 0;
              const compassDir = getCompassDirection(trackDeg);

              return (
                <div
                  key={plane.id || index}
                  className="relative group rounded-xl border border-cyan-500/30 bg-gradient-to-b from-[#081524] to-[#040912] p-3.5 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:-translate-y-0.5"
                >
                  {/* Neon HUD Corner Accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400 group-hover:border-emerald-400 transition-colors" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400 group-hover:border-emerald-400 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400 group-hover:border-emerald-400 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 group-hover:border-emerald-400 transition-colors" />

                  {/* Top Card Row: Callsign & Plane Icon */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-cyan-300">
                        <Plane 
                          className="w-4 h-4 transition-transform duration-500" 
                          style={{ transform: `rotate(${trackDeg - 90}deg)` }}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-500 block leading-tight">CALLSIGN</span>
                        <h4 className="text-sm font-black tracking-wider text-cyan-300 truncate group-hover:text-emerald-300 transition-colors">
                          {callsign}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded border border-zinc-800">
                      {plane.type || "AC"}
                    </span>
                  </div>

                  {/* Metrics 2x2 Data Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {/* Altitude Metric */}
                    <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 mb-0.5">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" /> ALTITUDE
                      </span>
                      <span className="text-emerald-300 font-bold text-xs block">
                        {formatAltitude(plane.altitude)}
                      </span>
                    </div>

                    {/* Speed Metric */}
                    <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 mb-0.5">
                        <Gauge className="w-3 h-3 text-amber-400" /> SPEED
                      </span>
                      <span className="text-amber-300 font-bold text-xs block">
                        {plane.speed ?? 0} <span className="text-[10px] text-zinc-500">KTS</span>
                      </span>
                    </div>

                    {/* Track / Heading Metric */}
                    <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 mb-0.5">
                          <Compass className="w-3 h-3 text-purple-400" /> HEADING / TRACK
                        </span>
                        <span className="text-purple-300 font-bold text-xs">
                          {trackDeg}&deg; {compassDir}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                        <Navigation 
                          className="w-3 h-3 text-cyan-400 transition-transform" 
                          style={{ transform: `rotate(${trackDeg}deg)` }} 
                        />
                        <span>{compassDir}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coordinates Footer */}
                  <div className="mt-2 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>HEX: <strong className="text-zinc-400">{plane.id || "UNKNOWN"}</strong></span>
                    {typeof plane.lat === "number" && typeof plane.lon === "number" && (
                      <span className="text-zinc-400">
                        {plane.lat.toFixed(2)}&deg;, {plane.lon.toFixed(2)}&deg;
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Compact Table View */
          <div className="overflow-x-auto rounded-xl border border-cyan-500/30 bg-black/50">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-cyan-950/60 text-cyan-400 border-b border-cyan-500/30 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Callsign</th>
                  <th className="py-2.5 px-3">Altitude</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Heading / Track</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 text-zinc-300">
                {aircraftList.map((plane, index) => {
                  const trackDeg = typeof plane.track === "number" ? plane.track : 0;
                  return (
                    <tr key={plane.id || index} className="hover:bg-cyan-500/10 transition-colors">
                      <td className="py-2 px-3 font-bold text-cyan-300">{plane.callsign || plane.id}</td>
                      <td className="py-2 px-3 text-emerald-400">{formatAltitude(plane.altitude)}</td>
                      <td className="py-2 px-3 text-amber-300">{plane.speed ?? 0} KTS</td>
                      <td className="py-2 px-3 text-purple-300">{trackDeg}&deg; ({getCompassDirection(trackDeg)})</td>
                      <td className="py-2 px-3 text-zinc-400">{plane.type || "N/A"}</td>
                      <td className="py-2 px-3 text-zinc-500 text-[11px]">
                        {typeof plane.lat === "number" ? `${plane.lat.toFixed(2)}°, ${plane.lon.toFixed(2)}°` : "N/A"}
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

export default TelemetryHUD;
