"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/theme/Header';

interface FaqItem {
  question: string;
  category: 'PROTOCOLS' | 'SUITS' | 'AIRSPACE' | 'SURVIVAL';
  answer: string;
  dangerLevel?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'PROTOCOLS',
    question: 'WHAT IS SKYNET BORDERLAND?',
    answer:
      'SKYNET Borderland is an airborne death-game survival protocol operating in restricted Japanese airspace (RJTT Tokyo Terminal Area). Twenty candidates are simultaneously synchronized into Flight AI204 avionics. Five successive trial chambers test intellect, physical endurance, tactical coordination, and psychological ruthlessness. Only one survivor is granted exfiltration clearance.',
  },
  {
    category: 'SUITS',
    question: 'HOW DO CARD SUITS DETERMINE SURVIVAL VECTORS?',
    answer:
      'Each candidate is assigned a tactical suit based on initial biometric telemetry: \n• ♦ DIAMONDS (Intellect & Ciphers): Logic puzzles, transponder frequency deciphering, avionics overrides.\n• ♠ SPADES (Physical & Endurance): G-force tolerance, cabin de-pressurization stamina, physical speed.\n• ♣ CLUBS (Teamwork & Balance): Distributed weight equilibrium, multi-player interlocks, shared quotas.\n• ♥ HEARTS (Psychological & Deception): Trust dilemmas, sacrifice votes, betrayal games.',
    dangerLevel: 'CRITICAL',
  },
  {
    category: 'AIRSPACE',
    question: 'WHAT HAPPENS DURING SQUAWK 7700 AIRSPACE LOCKDOWN?',
    answer:
      'When Flight AI204 broadcasts emergency Squawk 7700, civil air traffic control hands over sector management to the autonomous Borderland mainframe. Surrounding aircraft (NH217, JL004, BC101) are redirected, establishing a 50NM exclusion perimeter. Candidates must solve cabin protocols before the altimeter drops beneath minimum terrain clearance.',
    dangerLevel: 'DEFCON 1',
  },
  {
    category: 'SURVIVAL',
    question: 'HOW ARE FATALITIES EXECUTED WHEN QUOTAS EXPIRE?',
    answer:
      'Chambers operate on hard seat quotas and strict countdown clocks. When the timer hits 00:00: \n1. Unseated or unverified candidates lose cabin life-support synchronization.\n2. The lowest-scoring units in each stage are permanently expunged from the active registry.\n3. The biometric vital monitors (3 lives maximum) drop to zero, marking the candidate PURGED.',
    dangerLevel: 'LETHAL',
  },
  {
    category: 'PROTOCOLS',
    question: 'CAN CANDIDATES SHARE CABIN SEATS OR TEAM UP?',
    answer:
      'While Stage 4 (Same Page) explicitly mandates cooperative synchronization, earlier trials like Stage 1 (Flight 404: The Last Seat) and Stage 3 (Redline) impose zero-sum survivor caps. Cooperation is temporary; final exfiltration permits only one survivor.',
  },
  {
    category: 'SURVIVAL',
    question: 'HOW DO I EARN SURVIVAL POINTS AND SECURE EXFILTRATION?',
    answer:
      'Points are awarded for rapid cipher decryptions, seat locking speed, zero oxygen penalties, and voting accuracy. Maintaining the #1 ranking grants access to terminal overrides and root-level dispatch controls.',
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) => selectedCategory === 'ALL' || item.category === selectedCategory
  );

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e0e] text-[#e5e2e1] flex flex-col justify-between selection:bg-[#ff544b] selection:text-black overflow-x-hidden font-mono">
      <Header />

      <main className="w-full flex-1 flex flex-col pt-20 sm:pt-24 pb-8 relative z-10 px-3 sm:px-6 lg:px-8 max-w-[1200px] mx-auto select-none">
        {/* Header Banner */}
        <div className="bg-[#1c1b1b] p-4 sm:p-5 border border-[#353534] shadow-xl mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ff544b] animate-ping"></span>
            <span className="text-xs text-[#ffdad6] uppercase font-bold tracking-[0.2em] sm:tracking-[0.25em]">
              SYSTEM CLASSIFIED ARCHIVE // DOSSIER 092
            </span>
          </div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-4xl text-[#e5e2e1] uppercase font-bold tracking-wider">
            SURVIVAL HANDBOOK & FAQ
          </h1>
          <p className="font-sans text-xs text-[#af8783] uppercase tracking-wider mt-1">
            Tactical survival rules of engagement, suit taxonomy, and transponder protocols.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mb-6">
          {['ALL', 'PROTOCOLS', 'SUITS', 'AIRSPACE', 'SURVIVAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#ff544b] text-[#5c0005] border-white shadow-md'
                  : 'bg-[#201f1f] text-[#af8783] border-[#353534] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3 mb-6">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <div
                key={faq.question}
                className={`border transition-all ${
                  isOpen
                    ? 'bg-[#201f1f] border-[#ff544b] shadow-[0_0_20px_rgba(255,84,75,0.15)]'
                    : 'bg-[#1c1b1b] border-[#353534] hover:border-[#5f3f3b]'
                }`}
              >
                <button
                  onClick={() => setExpandedIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#ff544b] font-bold text-sm">{isOpen ? '▼' : '▶'}</span>
                    <div>
                      <span className="text-[10px] text-[#af8783] block uppercase font-semibold">
                        [{faq.category}]
                      </span>
                      <span className="text-sm font-bold text-[#e5e2e1] uppercase tracking-wider">
                        {faq.question}
                      </span>
                    </div>
                  </div>

                  {faq.dangerLevel && (
                    <span className="text-[10px] bg-[#93000a] text-[#ffdad6] px-2 py-0.5 font-bold uppercase border border-red-500/50 shrink-0">
                      {faq.dangerLevel}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#e9bcb7] leading-relaxed font-sans border-t border-[#353534]/60 whitespace-pre-line">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Dispatch Actions */}
        <div className="bg-[#1c1b1b] p-4 border border-[#353534] flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-[#af8783]">
            HAVE READ AND ACKNOWLEDGED SURVIVAL RULES OF ENGAGEMENT?
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/lobby')}
              className="px-4 py-2 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-bold text-xs uppercase cursor-pointer transition-colors"
            >
              ENTER ARENA LOBBY →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
