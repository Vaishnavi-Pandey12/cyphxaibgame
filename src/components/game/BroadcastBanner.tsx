"use client";

import React, { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Megaphone, Radio } from "lucide-react";

export function BroadcastBanner() {
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const broadcastRef = ref(database, "gameState/broadcast");
      const unsubscribe = onValue(broadcastRef, (snapshot) => {
        const val = snapshot.val();
        if (typeof val === "string") {
          setBroadcastMessage(val.trim() || null);
        } else if (val && typeof val === "object" && val.message) {
          setBroadcastMessage(val.message.trim() || null);
        } else {
          setBroadcastMessage(null);
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Broadcast banner subscription warning:", err);
    }
  }, []);

  if (!broadcastMessage) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl border-2 border-fuchsia-500 bg-gradient-to-r from-fuchsia-950/90 via-purple-950/90 to-black/95 text-fuchsia-200 flex items-center gap-3 shadow-[0_0_35px_rgba(217,70,239,0.4)] animate-pulse relative overflow-hidden z-20">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400" />
      <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300 flex-shrink-0">
        <Megaphone className="w-5 h-5 text-fuchsia-300 animate-bounce" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">
            ⚠️ GLOBAL GM DIRECTIVE // HIGH-PRIORITY TRANSMISSION
          </span>
          <span className="flex items-center gap-1 text-[9px] font-mono text-fuchsia-400/80 bg-fuchsia-950/60 px-1.5 py-0.5 rounded border border-fuchsia-800/60">
            <Radio className="w-2.5 h-2.5 animate-pulse" /> ALL SECTORS
          </span>
        </div>
        <div className="text-sm font-bold text-white font-mono mt-0.5 tracking-wide break-words">
          {broadcastMessage}
        </div>
      </div>
    </div>
  );
}
