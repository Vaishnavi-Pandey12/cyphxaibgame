"use client";

import React, { useEffect, useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, set, get } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";
import { Player } from "@/components/game/PlayerCard";
import { 
  Users, 
  Shield, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Terminal, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Radio, 
  HelpCircle, 
  RefreshCw, 
  Sparkles,
  Plane,
  Gauge,
  Compass,
  Zap
} from "lucide-react";
import Link from "next/link";
import { BroadcastBanner } from "@/components/game/BroadcastBanner";

interface TeamAnswer {
  playerId: string;
  playerName: string;
  answer: string;
  timestamp: number;
}

export default function Round4Page() {
  const [gameState, setGameState] = useState<any>(null);
  const [aircraftSnapshot, setAircraftSnapshot] = useState<Aircraft[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Player / Team Selection
  const [selectedTeam, setSelectedTeam] = useState<"Team 1" | "Team 2">("Team 1");
  const [answerInput, setAnswerInput] = useState("");
  const [isMasked, setIsMasked] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [myAnswer, setMyAnswer] = useState("");

  // Team Submissions from Firebase
  const [teamSubmissions, setTeamSubmissions] = useState<Record<string, Record<string, TeamAnswer>>>({
    "Team 1": {},
    "Team 2": {},
  });

  // GM Evaluation State
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Subscribe to Firebase gameState, aircraftSnapshot, players, and stage4Submissions
  useEffect(() => {
    try {
      const gameStateRef = ref(database, "gameState");
      const aircraftRef = ref(database, "gameState/aircraftSnapshot");
      const playersRef = ref(database, "players");
      const submissionsRef = ref(database, "gameState/stage4Submissions");

      const unsubGameState = onValue(gameStateRef, (snapshot) => {
        const val = snapshot.val();
        setGameState(val);
        if (val?.stage4Evaluated !== undefined) {
          setIsEvaluated(Boolean(val.stage4Evaluated));
        }
        setLoading(false);
      });

      const unsubAircraft = onValue(aircraftRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setAircraftSnapshot([]);
          return;
        }
        let parsed: Aircraft[] = [];
        if (Array.isArray(data)) parsed = data.filter(Boolean);
        else if (typeof data === "object") parsed = Object.values(data);
        setAircraftSnapshot(parsed);
      });

      const unsubPlayers = onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        let list: Player[] = [];
        if (Array.isArray(data)) {
          list = data.map((item, index) => ({ id: item?.id ? String(item.id) : `p_${index}`, ...item })).filter(Boolean);
        } else if (typeof data === "object") {
          list = Object.entries(data).map(([k, v]: [string, any]) => ({ id: k, ...v }));
        }
        setPlayers(list.filter((p) => p.status === "alive"));
      });

      const unsubSubmissions = onValue(submissionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === "object") {
          setTeamSubmissions(data);
        }
      });

      return () => {
        unsubGameState();
        unsubAircraft();
        unsubPlayers();
        unsubSubmissions();
      };
    } catch (e) {
      console.error("Firebase Round 4 setup error:", e);
      setLoading(false);
    }
  }, []);

  // Compute Question & Correct Answer from real-time aircraftSnapshot
  const questionData = useMemo(() => {
    if (aircraftSnapshot.length === 0) {
      return {
        question: "Awaiting aircraft snapshot telemetry stream...",
        highestAircraft: null,
        correctAnswer: "N/A",
      };
    }

    // Find aircraft with maximum altitude
    let maxAc = aircraftSnapshot[0];
    let maxAlt = typeof maxAc.altitude === "number" ? maxAc.altitude : parseInt(String(maxAc.altitude || "0"), 10) || 0;

    for (let i = 1; i < aircraftSnapshot.length; i++) {
      const ac = aircraftSnapshot[i];
      const alt = typeof ac.altitude === "number" ? ac.altitude : parseInt(String(ac.altitude || "0"), 10) || 0;
      if (alt > maxAlt) {
        maxAlt = alt;
        maxAc = ac;
      }
    }

    const callsign = maxAc.callsign || maxAc.id || "UNKNOWN";

    return {
      question: "What is the callsign of the aircraft flying at the highest altitude in the current airspace sector?",
      highestAircraft: maxAc,
      correctAnswer: callsign.trim().toUpperCase(),
    };
  }, [aircraftSnapshot]);

  // Teammates in the selected team
  const teamPlayers = useMemo(() => {
    return players.filter((p) => p.teamId === selectedTeam);
  }, [players, selectedTeam]);

  // Submit Answer
  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!answerInput.trim()) return;

    const cleanAnswer = answerInput.trim().toUpperCase();
    const submissionId = `sub_${Date.now()}`;

    setMyAnswer(cleanAnswer);
    setSubmitted(true);

    try {
      const subRef = ref(database, `gameState/stage4Submissions/${selectedTeam}/${submissionId}`);
      await set(subRef, {
        playerId: submissionId,
        playerName: `Operative_${selectedTeam === "Team 1" ? "Alpha" : "Bravo"}`,
        answer: cleanAnswer,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("Could not write team submission to Firebase:", err);
    }
  };

  // Game Master Action: Populate Mock Team Submissions for Testing
  const handleSimulateTeamConsensus = async (isCorrect: boolean, isConsensus: boolean) => {
    try {
      const team = selectedTeam;
      const updates: Record<string, any> = {};

      const simulatedAnswer = isCorrect
        ? questionData.correctAnswer
        : isConsensus
        ? "MOCK_WRONG_FLT99"
        : `WRONG_${Math.floor(Math.random() * 900) + 100}`;

      for (let i = 1; i <= 3; i++) {
        const id = `mock_${team.replace(/\s+/g, "_")}_op_${i}`;
        const ans = isConsensus ? simulatedAnswer : isCorrect && i === 1 ? questionData.correctAnswer : `DIFFERENT_${i}`;
        updates[`${team}/${id}`] = {
          playerId: id,
          playerName: `${team} Operative 0${i}`,
          answer: ans,
          timestamp: Date.now() + i * 10,
        };
      }

      const subsRef = ref(database, "gameState/stage4Submissions");
      await set(subsRef, {
        ...teamSubmissions,
        ...updates,
      });
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  // Game Master Action: EVALUATE TEAMS
  const handleEvaluateTeams = async () => {
    setIsEvaluating(true);
    const nextState = !isEvaluated;
    setIsEvaluated(nextState);

    try {
      const evalRef = ref(database, "gameState/stage4Evaluated");
      await set(evalRef, nextState);
    } catch (err) {
      console.warn("Failed to sync stage4Evaluated:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Evaluation logic for each team
  // Rule: At least ONE right OR ALL members submitted the EXACT SAME wrong answer!
  const evaluateTeamResults = (team: "Team 1" | "Team 2") => {
    const rawSubs = teamSubmissions[team] || {};
    const list: TeamAnswer[] = Object.values(rawSubs);

    if (list.length === 0) {
      return {
        evaluated: false,
        passed: false,
        ruleSatisfied: "NO_SUBMISSIONS",
        answers: [],
        message: "No answers submitted for this squad.",
      };
    }

    const answers = list.map((item) => item.answer.trim().toUpperCase());
    const correct = questionData.correctAnswer.toUpperCase();

    // Condition 1: At least one member is right
    const hasAtLeastOneCorrect = answers.some((a) => a === correct);

    // Condition 2: ALL members submitted the EXACT same wrong answer
    const allSameWrong =
      answers.length > 1 &&
      answers.every((a) => a === answers[0]) &&
      answers[0] !== correct;

    const passed = hasAtLeastOneCorrect || allSameWrong;

    let ruleSatisfied = "FAILED";
    if (hasAtLeastOneCorrect) {
      ruleSatisfied = "RULE 1: AT LEAST ONE OPERATIVE CORRECT (ACCURACY)";
    } else if (allSameWrong) {
      ruleSatisfied = "RULE 2: UNANIMOUS CONSENSUS WRONG (TEAM TRUST)";
    }

    return {
      evaluated: true,
      passed,
      ruleSatisfied,
      answers: list,
      hasAtLeastOneCorrect,
      allSameWrong,
      message: passed 
        ? "SQUAD SURVIVED // PROTOCOL SATISFIED" 
        : "SQUAD COMPROMISED // DISCORD DETECTED",
    };
  };

  const team1Result = evaluateTeamResults("Team 1");
  const team2Result = evaluateTeamResults("Team 2");

  return (
    <div className="relative min-h-screen bg-[#030713] text-[#e6edf3] font-mono selection:bg-cyan-500 selection:text-black overflow-x-hidden scanlines">
      {/* Background Cyber Atmosphere */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-25 z-0" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        
        {/* Global GM Announcement Banner */}
        <BroadcastBanner />

        {/* Header */}
        <header className="mb-6 rounded-2xl border border-cyan-500/30 bg-[#071120]/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_25px_rgba(0,240,255,0.12)]">
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
                    STAGE 04 // PLANE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                    TEAM TRUST PROTOCOL
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ISOLATION CHAMBERS ACTIVE
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 mt-1">
                  STAGE 4: TEAM TRUST (BLIND TRANSMISSION)
                </h1>
              </div>
            </div>

            {/* Team Affiliation Selector / Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-bold">YOUR SQUAD:</span>
              <div className="flex rounded-xl border border-zinc-800 p-1 bg-black/60">
                <button
                  onClick={() => {
                    setSelectedTeam("Team 1");
                    setSubmitted(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    selectedTeam === "Team 1"
                      ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]"
                      : "text-zinc-400 hover:text-cyan-300"
                  }`}
                >
                  TEAM 1
                </button>
                <button
                  onClick={() => {
                    setSelectedTeam("Team 2");
                    setSubmitted(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    selectedTeam === "Team 2"
                      ? "bg-fuchsia-500 text-black shadow-[0_0_12px_rgba(255,0,128,0.5)]"
                      : "text-zinc-400 hover:text-fuchsia-300"
                  }`}
                >
                  TEAM 2
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Game Master Evaluation Bar */}
        <div className="mb-6 rounded-2xl border-2 border-purple-500/40 bg-[#0e071c]/90 backdrop-blur-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-400/40 text-purple-300">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-500 text-black">
                  GM ARBITRATION
                </span>
                <span className="text-xs font-black tracking-widest text-purple-200 uppercase">
                  TEAM TRUST EVALUATION ENGINE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Survive condition: <strong className="text-emerald-300">&ge; 1 Right Answer</strong> OR <strong className="text-fuchsia-300">Unanimous Same Wrong Answer</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Simulation Helpers for testing */}
            <button
              onClick={() => handleSimulateTeamConsensus(false, true)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-purple-400 text-[10px] text-zinc-300 transition-colors cursor-pointer"
              title="Inject 3 teammates with the exact same wrong answer to test Trust Rule"
            >
              SIMULATE TRUST (SAME WRONG)
            </button>
            <button
              onClick={() => handleSimulateTeamConsensus(true, false)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-400 text-[10px] text-zinc-300 transition-colors cursor-pointer"
              title="Inject teammates with at least 1 correct answer"
            >
              SIMULATE 1 CORRECT
            </button>

            {/* Main Required GM EVALUATE TEAMS Button */}
            <button
              onClick={handleEvaluateTeams}
              disabled={isEvaluating}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
                isEvaluated
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(157,78,221,0.4)]"
                  : "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-pulse"
              }`}
            >
              {isEvaluating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              <span>{isEvaluated ? "RE-EVALUATE TEAMS" : "⚖️ EVALUATE TEAMS"}</span>
            </button>
          </div>
        </div>

        {/* Evaluation Verdict Panels (Shown after GM clicks EVALUATE TEAMS) */}
        {isEvaluated && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team 1 Verdict Card */}
            <div className={`p-4 rounded-xl border ${
              team1Result.passed 
                ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-200" 
                : "border-red-500/60 bg-red-950/40 text-red-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-cyan-300">TEAM 1 ARBITRATION</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  team1Result.passed ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50" : "bg-red-500/30 text-red-300 border border-red-500/50"
                }`}>
                  {team1Result.passed ? "SURVIVED" : "COMPROMISED"}
                </span>
              </div>
              <p className="text-xs font-bold">{team1Result.ruleSatisfied}</p>
              <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                <span>SUBMISSIONS ({team1Result.answers.length}): </span>
                <span className="text-white">{team1Result.answers.map((a) => a.answer).join(", ") || "None"}</span>
              </div>
            </div>

            {/* Team 2 Verdict Card */}
            <div className={`p-4 rounded-xl border ${
              team2Result.passed 
                ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-200" 
                : "border-red-500/60 bg-red-950/40 text-red-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-fuchsia-300">TEAM 2 ARBITRATION</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  team2Result.passed ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50" : "bg-red-500/30 text-red-300 border border-red-500/50"
                }`}>
                  {team2Result.passed ? "SURVIVED" : "COMPROMISED"}
                </span>
              </div>
              <p className="text-xs font-bold">{team2Result.ruleSatisfied}</p>
              <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                <span>SUBMISSIONS ({team2Result.answers.length}): </span>
                <span className="text-white">{team2Result.answers.map((a) => a.answer).join(", ") || "None"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Stage Grid: Question & Blind Input Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Left Panel: Question & Radar Context (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-cyan-500/30 bg-[#061224]/90 backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,240,255,0.1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3 pb-2 border-b border-cyan-500/20">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>INTERCEPTED AIRSPACE TELEMETRY INQUIRY</span>
              </div>

              {/* High Stakes Question */}
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 mb-4">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  TACTICAL AIRSPACE QUESTION:
                </span>
                <h2 className="text-base sm:text-lg font-black text-white leading-relaxed">
                  {questionData.question}
                </h2>
              </div>

              <div className="space-y-2 text-xs font-mono text-zinc-300">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-500">SURVIVAL PROTOCOL:</span>
                  <span className="text-emerald-400 font-bold">ACCURACY OR UNANIMITY</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-500">ISOLATION MODE:</span>
                  <span className="text-amber-400 font-bold">BLIND TERMINAL INPUT</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-500">ACTIVE FLIGHT TARGETS:</span>
                  <span className="text-cyan-300 font-bold">{aircraftSnapshot.length} IN RADAR MEMORY</span>
                </div>
              </div>
            </div>

            {/* Flight Context Footnote */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>ACTIVE AFFILIATION: <strong className={selectedTeam === "Team 1" ? "text-cyan-400" : "text-fuchsia-400"}>{selectedTeam}</strong></span>
              <span>GM ANSWER KEY: <strong className="text-zinc-400">{questionData.correctAnswer}</strong></span>
            </div>
          </div>

          {/* Right Panel: Blind Input & Submission Terminal (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-cyan-500/30 bg-[#061224]/90 backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,240,255,0.1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black tracking-widest text-zinc-300 uppercase">
                    BLIND TRANSMISSION INPUT
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="text-zinc-500 hover:text-cyan-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {isMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isMasked ? "UNMASK" : "MASK"}</span>
                </button>
              </div>

              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase">
                    ENTER AIRCRAFT CALLSIGN:
                  </label>
                  <div className="relative">
                    <input
                      type={isMasked ? "password" : "text"}
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="e.g. UAL1234 or DAL890"
                      className="w-full py-3 px-4 rounded-xl bg-black/70 border border-cyan-500/40 text-cyan-300 font-black tracking-widest text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 uppercase placeholder:normal-case placeholder:text-zinc-600"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                      BLIND
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Your transmission is blinded from other operatives in your squad.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!answerInput.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>SUBMIT ANSWER</span>
                </button>
              </form>
            </div>

            {/* Submission Confirmation Box */}
            {submitted && (
              <div className="mt-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-xs text-cyan-200">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ANSWER RECORDED FOR {selectedTeam}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Transmitted: <strong className="text-white font-mono">{isMasked ? "••••••••" : myAnswer}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-zinc-600 text-[11px] font-mono border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALICE IN HACKERLAND &bull; STAGE 4: PLANE TRUST PROTOCOL</span>
          <span>ACTIVE TEAM: {selectedTeam}</span>
        </footer>

      </div>
    </div>
  );
}
