"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Terminal, ShieldAlert, Zap } from "lucide-react";

export default function Home() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/lobby");
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      setError(null);
      setLogging(true);
      await loginWithGoogle();
    } catch {
      setError("Authentication failed. Try again.");
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center font-mono text-cyan-500 text-sm tracking-widest">
        INITIALIZING SECURE CHANNEL...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-mono flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-20 z-0" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-0" />

      {/* Neon glow blobs */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center p-8 text-center max-w-xl w-full">
        {/* Icon */}
        <div className="p-4 mb-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.12)] inline-block">
          <Terminal className="w-14 h-14 text-cyan-400 mx-auto" />
        </div>

        {/* Title */}
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase">
          <span className="w-8 h-px bg-zinc-700" />
          <Zap className="w-3 h-3 text-cyan-500" />
          <span>SURVIVAL PROTOCOL ACTIVE</span>
          <Zap className="w-3 h-3 text-cyan-500" />
          <span className="w-8 h-px bg-zinc-700" />
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-white to-purple-400 mb-3 leading-none">
          skynet
          <span className="text-zinc-600">:</span>
          borderland
        </h1>

        <p className="text-base text-zinc-400 tracking-widest font-bold mb-2 uppercase">
          The sky is the arena.
        </p>
        <p className="text-sm text-zinc-600 tracking-wider mb-10">
          Aircraft are the judges. Five trials. One survivor.
        </p>

        {/* Description */}
        <div className="w-full text-left text-xs text-zinc-500 mb-8 border border-zinc-800 rounded-xl bg-black/40 p-4 leading-relaxed space-y-1">
          <div><span className="text-cyan-400 font-bold">01 /</span> FLIGHT 404 — Choose your seat wisely.</div>
          <div><span className="text-teal-400 font-bold">02 /</span> FISHING — Survive the Jack's searchlight.</div>
          <div><span className="text-red-400 font-bold">03 /</span> REDLINE — Navigate the laser matrix.</div>
          <div><span className="text-fuchsia-400 font-bold">04 /</span> SAME PAGE — Answer as one or die alone.</div>
          <div><span className="text-yellow-400 font-bold">05 /</span> DEJA VU — Remember. Or be forgotten.</div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2 text-red-400 bg-red-950/40 px-4 py-2 rounded-lg border border-red-500/40 text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={logging}
          className="w-full px-8 py-4 rounded-xl border-2 border-cyan-500 bg-transparent text-cyan-400 font-black tracking-widest uppercase text-sm hover:bg-cyan-500 hover:text-black transition-all duration-200 shadow-[0_0_25px_rgba(0,240,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {logging ? (
            <>
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              CONNECTING...
            </>
          ) : (
            "AUTHENTICATE VIA GOOGLE"
          )}
        </button>

        <p className="mt-4 text-[11px] text-zinc-700 tracking-wide">
          No account needed — just your Google identity.
        </p>
      </main>
    </div>
  );
}
