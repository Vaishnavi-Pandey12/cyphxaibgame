"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { STAGES_LIST } from '@/lib/stages';
import { Header } from '@/components/theme/Header';

export default function HomePage() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEnterCrucible = async () => {
    if (user) {
      router.push('/lobby');
      return;
    }
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      router.push('/lobby');
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e0e] text-[#e5e2e1] flex flex-col justify-between selection:bg-[#ff544b] selection:text-black overflow-x-hidden font-mono">
      {/* Persistent Tactical Header */}
      <Header />

      {/* Main View Area */}
      <main className="w-full flex-1 flex flex-col pt-16 sm:pt-20 pb-8 relative z-10">
        <div className="relative w-full flex-1 flex flex-col justify-center items-center min-h-[calc(100vh-5rem)] px-3 sm:px-8 py-8 sm:py-10 select-none overflow-hidden">
          {/* Immersive Cinematic Landing Background Artwork */}
          <div className="absolute inset-0 -z-10 bg-[#0e0e0e]">
            <img
              alt="SKYNET BorderLand Cinematic Airspace"
              className="w-full h-full object-cover object-center pointer-events-none opacity-85"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhmBMs_wrwRevn1ytXIOZ6LNtF-xtxTEpK0bfBOjB_AxDHZ3a8uOyzLQMgozeyi9DmrmoA72qqTLB4mmxekDos3E8fRz450G58UTDzZoqsLNIw0SKhwHr4eLxDUcWjA9GJpSq-l32dqxJUqwvZQprrZae2VFN6m9QbGz3t_fIw0kl99q4vh6EFQy3y3LbKlPWCZOHndqQgkzPKWWF0JKrfEnP51xgRCSnKU9dAGAiq7fw2eCkeRkdIjVsOmO4evp8O-w"
            />
            {/* Subtle dark gradient wash to ensure pristine contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-[#0e0e0e]/70 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(14,14,14,0.85)_95%)] pointer-events-none"></div>
          </div>

          {/* Atmospheric Peripheral Tactical Annotations */}
          {/* Top Left: SKIES HIDE SECRETS */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 lg:top-8 lg:left-12 flex flex-col items-start gap-1 z-10 pointer-events-none">
            <div className="font-mono text-[10px] sm:text-xs text-[#ffb4ab]/90 uppercase tracking-[0.25em] sm:tracking-[0.3em] font-medium">
              SKIES<br />HIDE<br />SECRETS
            </div>
            <div className="w-4 sm:w-5 h-[1.5px] bg-[#ff544b] mt-0.5"></div>
          </div>

          {/* Top Center: FL404 coordinate tag */}
          <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 pointer-events-none opacity-80">
            <span className="font-mono text-xs sm:text-sm text-[#ff544b] font-bold">✕</span>
            <span className="font-mono text-[11px] sm:text-xs text-[#af8783] uppercase tracking-[0.35em]">FL404</span>
          </div>

          {/* Top Right: TRUST NO FLIGHT */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 lg:top-8 lg:right-12 flex flex-col items-end gap-1 z-10 text-right pointer-events-none">
            <div className="font-mono text-[10px] sm:text-xs text-[#ffb4ab]/90 uppercase tracking-[0.25em] sm:tracking-[0.3em] font-medium">
              TRUST<br />NO<br />FLIGHT
            </div>
            <div className="w-4 sm:w-5 h-[1.5px] bg-[#ff544b] mt-0.5 self-end"></div>
          </div>

          {/* Mid Right: AIRSPACE RESTRICTED warning */}
          <div className="absolute right-4 sm:right-6 lg:right-12 top-1/3 -translate-y-1/2 hidden md:flex items-center gap-2 z-10 pointer-events-none bg-[#0e0e0e]/70 px-3 py-1.5 border border-[#ff544b]/30">
            <span className="w-2 h-2 rounded-full bg-[#ff544b] animate-ping"></span>
            <span className="font-mono text-xs text-[#ff544b] uppercase tracking-[0.25em] font-bold">
              AIRSPACE RESTRICTED
            </span>
          </div>

          {/* Lower Left: TRACK DECIPHER SURVIVE */}
          <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-6 lg:bottom-10 lg:left-12 flex flex-col items-start gap-0.5 z-10 pointer-events-none">
            <span className="font-mono text-[9px] sm:text-[11px] text-[#af8783] uppercase tracking-[0.22em] sm:tracking-[0.28em] font-medium leading-relaxed">
              TRACK<br />DECIPHER<br />SURVIVE
            </span>
          </div>

          {/* Lower Center-Right: TRK 315 / ALT 36000 */}
          <div className="absolute bottom-10 right-24 lg:right-80 hidden sm:flex flex-col items-start font-mono text-[11px] text-[#af8783]/80 uppercase tracking-widest z-10 pointer-events-none">
            <span>TRK 315</span>
            <span>ALT 36000</span>
          </div>

          {/* Lower Right: EVERY FLIGHT LEAVES A TRACE */}
          <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-6 lg:bottom-10 lg:right-12 flex flex-col items-end gap-1 z-10 text-right pointer-events-none">
            <div className="font-mono text-[9px] sm:text-[11px] text-[#e5e2e1]/80 uppercase tracking-[0.22em] sm:tracking-[0.28em] font-medium leading-tight">
              EVERY<br />FLIGHT<br />LEAVES<br />A TRACE
            </div>
            <div className="w-4 sm:w-5 h-[1.5px] bg-[#5f3f3b] mt-0.5 self-end"></div>
          </div>

          {/* CENTRAL HERO COMMAND DECK */}
          <div className="relative z-20 flex flex-col items-center text-center max-w-4xl mx-auto my-auto py-4 sm:py-8 w-full">
            {/* Surmounting Tactical Status Pill */}
            <div className="inline-flex items-center gap-2 bg-[#0e0e0e]/85 backdrop-blur-md border border-[#ff544b]/40 px-3 sm:px-4 py-1.5 mb-4 sm:mb-6 shadow-[0_0_20px_rgba(255,84,75,0.2)] max-w-full">
              <span className="w-2 h-2 rounded-full bg-[#ff544b] animate-ping shrink-0"></span>
              <span className="font-mono text-[10px] sm:text-xs text-[#ffb4ab] tracking-[0.18em] sm:tracking-[0.25em] uppercase font-bold truncate">
                RESTRICTED AIRSPACE SECTOR 04 // LIVE SURVIVAL PROTOCOL
              </span>
            </div>

            {/* Monumental Wordmark: SKYNET with Ascending Jet and Ruby Star */}
            <div className="relative flex flex-col items-center justify-center select-none group w-full">
              <div className="absolute -inset-10 bg-[#ff544b]/15 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="relative flex items-center justify-center">
                <h1 className="font-['Cinzel'] text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f0e8e6] to-[#af8783] tracking-[0.12em] sm:tracking-[0.14em] uppercase drop-shadow-[0_4px_35px_rgba(255,84,75,0.45)] relative">
                  SK
                  <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-b from-white to-[#ffdad6]">
                    Y
                    {/* Ascending Jet silhouette on top of stem */}
                    <span className="absolute -top-5 sm:-top-9 md:-top-12 left-1/2 -translate-x-1/2 text-[#ffdad6] text-[22px] sm:text-[42px] md:text-[54px] drop-shadow-[0_0_14px_#ff544b] pointer-events-none select-none">
                      ✈
                    </span>
                    {/* Ruby Star in the fork */}
                    <span className="absolute top-[48%] left-1/2 -translate-x-1/2 text-[#ff544b] text-[10px] sm:text-base leading-none drop-shadow-[0_0_10px_#ff544b]">
                      ✦
                    </span>
                  </span>
                  NET
                </h1>
              </div>

              {/* BorderLand Subtitle with Accent Flourish Lines */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-6 w-full mt-1 sm:mt-2">
                <div className="h-[1.5px] w-10 sm:w-32 bg-gradient-to-r from-transparent to-[#ff544b]"></div>
                <h2 className="font-['Cinzel'] text-lg sm:text-3xl md:text-4xl text-[#e5e2e1] tracking-[0.28em] sm:tracking-[0.38em] uppercase font-semibold drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                  Border<span className="text-[#ffdad6]">Land</span>
                </h2>
                <div className="h-[1.5px] w-10 sm:w-32 bg-gradient-to-l from-transparent to-[#ff544b]"></div>
              </div>
            </div>

            {/* Survival Crucible Stakes Badge */}
            <div className="mt-5 sm:mt-8 bg-[#0e0e0e]/90 backdrop-blur-md border border-[#5f3f3b]/60 px-4 sm:px-8 py-2 sm:py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.8)] flex items-center justify-center gap-2.5 sm:gap-6 flex-wrap">
              <span className="font-mono text-[11px] sm:text-sm text-[#ffb4ab] font-bold tracking-[0.16em] sm:tracking-[0.2em]">[ 20 PLAYERS</span>
              <span className="text-[#ff544b] text-xs sm:text-sm">◆</span>
              <span className="font-mono text-[11px] sm:text-sm text-[#e5e2e1] font-bold tracking-[0.16em] sm:tracking-[0.2em]">5 TRIALS</span>
              <span className="text-[#ff544b] text-xs sm:text-sm">◆</span>
              <span className="font-mono text-[11px] sm:text-sm text-[#ffdad4] font-bold tracking-[0.16em] sm:tracking-[0.2em]">1 SURVIVOR ]</span>
            </div>

            {/* Primary Tactical Trigger Buttons */}
            <div className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-lg px-2">
              {/* Blood-Red Primary CTA */}
              <button
                onClick={handleEnterCrucible}
                disabled={isLoggingIn}
                className="w-full sm:w-auto min-w-[220px] sm:min-w-[250px] group relative bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-mono text-xs sm:text-sm uppercase py-3.5 sm:py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(255,84,75,0.6)] hover:shadow-[0_0_45px_rgba(255,84,75,0.9)] cursor-pointer font-bold tracking-[0.22em] sm:tracking-[0.25em] disabled:opacity-50"
              >
                <span className="w-2.5 h-2.5 bg-[#5c0005]"></span>
                <span>
                  {isLoggingIn ? 'AUTHENTICATING...' : user ? '[ ENTER LOBBY → ]' : '[ ENTER HACKER LAND → ]'}
                </span>
              </button>

              {/* Secondary Wireframe Ghost CTA */}
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto min-w-[200px] sm:min-w-[230px] group relative bg-[#1c1b1b]/90 hover:bg-[#201f1f] border border-[#af8783]/50 hover:border-[#ff544b] text-[#e5e2e1] font-mono text-xs sm:text-sm uppercase py-3.5 sm:py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-sm cursor-pointer font-semibold tracking-[0.18em] sm:tracking-[0.22em]"
              >
                <span className="font-mono text-[#ff544b] group-hover:rotate-45 transition-transform duration-300">
                  ◎
                </span>
                <span>[ DASHBOARD OVERVIEW → ]</span>
              </button>
            </div>

            {/* Clearance Metadata Subtext */}
            <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[#af8783] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#ffb4ab] rounded-full"></span>
                <span className="text-[#e5e2e1]">
                  {user ? `LOGGED IN AS ${user.displayName || user.email}` : 'CLEARANCE: LEVEL 0 OMNI'}
                </span>
              </div>
              <span className="text-[#5f3f3b]">/</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#ff544b]">🔊</span>
                <span className="text-[#ffb4a8]">AUDIO TELEMETRY: READY</span>
              </div>
              <span className="text-[#5f3f3b] hidden sm:inline">/</span>
              <span className="hidden sm:inline text-[#af8783]">TRANSPONDER FREQ 121.500 MHZ</span>
            </div>

            {/* Mini 5-Trials Ticker Overview */}
            <div className="mt-6 sm:mt-8 w-full max-w-2xl bg-[#0e0e0e]/85 backdrop-blur-md border border-[#5f3f3b]/50 p-2.5 sm:p-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#353534]/60 px-1">
                <span className="font-sans text-[9px] sm:text-[10px] text-[#af8783] uppercase tracking-widest font-semibold">
                  ACTIVE ARENA CYCLE // 5 TRIALS
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] text-[#ff544b] font-bold uppercase tracking-wider">
                  SURVIVAL PROTOCOL LOADED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-2">
                {STAGES_LIST.map((stg) => (
                  <button
                    key={stg.id}
                    onClick={() => router.push('/dashboard')}
                    className={`p-2 flex flex-col text-left transition-all cursor-pointer border ${
                      stg.id === 'stage-1'
                        ? 'bg-[#2a2a2a]/80 border-l-2 border-l-[#ff544b] border-[#5f3f3b]'
                        : 'bg-[#1c1b1b]/70 border-[#353534]/50 hover:bg-[#201f1f] hover:border-[#ff544b]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#ffdad6] font-bold">
                        {stg.code}
                      </span>
                      <span className="text-[#ff544b] text-xs font-bold">{stg.suitSymbol}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#e5e2e1] truncate uppercase mt-0.5 font-semibold">
                      {stg.name}
                    </span>
                    <span className="font-sans text-[9px] text-[#af8783] uppercase tracking-wide">
                      {stg.trialType.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
