import { database } from "@/lib/firebase";
import { ref, set, get, update } from "firebase/database";
import { Aircraft, DEMO_AIRCRAFT_SNAPSHOT } from "@/lib/airplanes";

const TOTAL_PLAYERS = 20;
const ROUND_DURATION_MS = 120_000; // 2 minutes

// ─────────────────────────────────────────────────────────────
// Aircraft Fetching
// ─────────────────────────────────────────────────────────────

export async function fetchThreeAircraft(): Promise<Aircraft[]> {
  try {
    const res = await fetch(`/api/flights?lat=40.7128&lon=-74.0060&dist=50`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const raw: any[] = Array.isArray(data?.ac) ? data.ac : [];

    const mapped: Aircraft[] = raw.slice(0, 10).map((item, i) => ({
      id: item.hex || `ac_${i}`,
      callsign: item.flight ? item.flight.trim() : `FLT${100 + i}`,
      lat: typeof item.lat === "number" ? item.lat : 0,
      lon: typeof item.lon === "number" ? item.lon : 0,
      altitude: item.alt_baro ?? 30000,
      speed: typeof item.gs === "number" ? item.gs : 400,
      track: typeof item.track === "number" ? item.track : 180,
      type: item.t || "B738",
    }));

    const result: Aircraft[] = [];
    for (let i = 0; i < 3; i++) {
      result.push(mapped[i] ?? DEMO_AIRCRAFT_SNAPSHOT[i]);
    }
    return result;
  } catch {
    return DEMO_AIRCRAFT_SNAPSHOT.slice(0, 3);
  }
}

// ─────────────────────────────────────────────────────────────
// Bot Generation
// ─────────────────────────────────────────────────────────────

const BOT_NAMES = [
  "GHOST_X", "CIPHER_7", "NULL_PTR", "STACK_OVR", "ROOT_ZERO",
  "DARK_NODE", "VOID_ECHO", "BINARY_99", "KERN_PAN", "SEGFAULT",
  "HEX_WRAITH", "ZOMBIE_IO", "DAEMON_X", "PHANTOM_R", "NETRUNNER",
  "BYTE_BEND", "CRASH_LOP", "CORRUPT_Z", "LOGIC_BMB", "FORK_BOMB",
];

export async function fillBotsToMax(
  currentPlayers: Record<string, any>
): Promise<void> {
  const currentCount = Object.keys(currentPlayers).length;
  const botsNeeded = Math.max(0, TOTAL_PLAYERS - currentCount);
  if (botsNeeded === 0) return;

  const updates: Record<string, any> = {};
  for (let i = 0; i < botsNeeded; i++) {
    const botId = `bot_${Date.now()}_${i}`;
    const name = BOT_NAMES[i % BOT_NAMES.length];
    updates[`players/${botId}`] = {
      id: botId,
      name,
      alias: name,
      avatar: null,
      status: "alive",
      connected: true,
      isBot: true,
      survivedRounds: 0,
      joinedAt: Date.now() + i * 10,
    };
  }
  await update(ref(database), updates);
}

// ─────────────────────────────────────────────────────────────
// ROUND 1 — Flight 404
// ─────────────────────────────────────────────────────────────

/** Seats 1-20; returns 5 unsafe seat numbers derived from aircraft[0].altitude */
export function computeUnsafeSeats(aircraft: Aircraft[]): number[] {
  const alt =
    typeof aircraft[0].altitude === "number"
      ? aircraft[0].altitude
      : parseInt(String(aircraft[0].altitude)) || 30000;
  const anchor = Math.abs(alt) % 20;
  const unsafe: number[] = [];
  for (let i = 0; i < 5; i++) unsafe.push(((anchor + i) % 20) + 1);
  return unsafe;
}

export async function setupRound1(
  aircraft: Aircraft[],
  allPlayers: Record<string, any>
): Promise<void> {
  const unsafeSeats = computeUnsafeSeats(aircraft);
  const bots = Object.values(allPlayers).filter((p: any) => p.isBot);

  // Pre-assign bot seats: 60% chance pick unsafe
  const botSeats: Record<string, number> = {};
  const usedSeats = new Set<number>();
  const allSeatNums = Array.from({ length: 20 }, (_, i) => i + 1);

  bots.forEach((bot: any) => {
    const pickUnsafe = Math.random() < 0.6;
    let seat: number;
    if (pickUnsafe) {
      const opts = unsafeSeats.filter((s) => !usedSeats.has(s));
      seat =
        opts.length > 0
          ? opts[Math.floor(Math.random() * opts.length)]
          : allSeatNums.filter((s) => !usedSeats.has(s))[0] ?? 1;
    } else {
      const safeSeatOpts = allSeatNums.filter(
        (s) => !unsafeSeats.includes(s) && !usedSeats.has(s)
      );
      seat =
        safeSeatOpts.length > 0
          ? safeSeatOpts[Math.floor(Math.random() * safeSeatOpts.length)]
          : allSeatNums.filter((s) => !usedSeats.has(s))[0] ?? 1;
    }
    usedSeats.add(seat);
    botSeats[bot.id] = seat;
  });

  await update(ref(database), {
    "gameState/round1/unsafeSeats": unsafeSeats,
    "gameState/round1/botSeats": botSeats,
    "gameState/round1/lockedSeats": {},
    "gameState/round1/eliminated": {},
    "gameState/round1/phase": "selecting",
  });
}

export async function resolveRound1(): Promise<string[]> {
  const [r1Snap, pSnap] = await Promise.all([
    get(ref(database, "gameState/round1")),
    get(ref(database, "players")),
  ]);
  const r1 = r1Snap.val() || {};
  const players = pSnap.val() || {};
  const unsafeSeats: number[] = r1.unsafeSeats || [];
  const locked: Record<string, number> = { ...(r1.botSeats || {}), ...(r1.lockedSeats || {}) };

  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive") return;
    const seat = locked[uid];
    if (!seat || unsafeSeats.includes(seat)) {
      eliminated.push(uid);
      updates[`players/${uid}/status`] = "eliminated";
      updates[`gameState/round1/eliminated/${uid}`] = true;
    } else {
      updates[`players/${uid}/survivedRounds`] = (p.survivedRounds || 0) + 1;
    }
  });
  updates["gameState/round1/phase"] = "revealed";
  await update(ref(database), updates);
  return eliminated;
}

// ─────────────────────────────────────────────────────────────
// ROUND 2 — Fishing
// ─────────────────────────────────────────────────────────────

/** Deterministic flashlight X column from elapsed time + aircraft speed */
export function computeFlashlightX(aircraft: Aircraft[], roundStartedAt: number): number {
  const elapsed = Date.now() - roundStartedAt;
  const steps = Math.floor(elapsed / 5000);
  const baseX = Math.floor((typeof aircraft[1]?.speed === "number" ? aircraft[1].speed : 400) % 10);
  return (baseX + steps) % 10;
}

/** Consistent column for a player based on uid hash */
export function playerColumn(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % 10;
}

export async function resolveRound2(): Promise<string[]> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};
  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

  // Bots: 40% elimination rate
  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive" || !p.isBot) return;
    if (Math.random() < 0.4) {
      eliminated.push(uid);
      updates[`players/${uid}/status`] = "eliminated";
      updates[`gameState/round2/eliminated/${uid}`] = true;
    } else {
      updates[`players/${uid}/survivedRounds`] = (p.survivedRounds || 0) + 1;
    }
  });

  if (Object.keys(updates).length > 0) await update(ref(database), updates);
  return eliminated;
}

// ─────────────────────────────────────────────────────────────
// ROUND 3 — Redline
// ─────────────────────────────────────────────────────────────

/** 3 active laser columns, changing every 2s, derived from aircraft[2].track */
export function computeActiveLaserCols(aircraft: Aircraft[], roundStartedAt: number): number[] {
  const elapsed = Date.now() - roundStartedAt;
  const cycle = Math.floor(elapsed / 2000);
  const track = typeof aircraft[2]?.track === "number" ? aircraft[2].track : 180;
  const base = Math.floor(track % 10);
  return [(base + cycle) % 10, (base + cycle + 3) % 10, (base + cycle + 6) % 10];
}

export async function resolveRound3(): Promise<string[]> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};
  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

  // Bots: 65% elimination rate
  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive" || !p.isBot) return;
    if (Math.random() < 0.65) {
      eliminated.push(uid);
      updates[`players/${uid}/status`] = "eliminated";
      updates[`gameState/round3/eliminated/${uid}`] = true;
    } else {
      updates[`players/${uid}/survivedRounds`] = (p.survivedRounds || 0) + 1;
    }
  });

  if (Object.keys(updates).length > 0) await update(ref(database), updates);
  return eliminated;
}

// ─────────────────────────────────────────────────────────────
// ROUND 4 — Same Page
// ─────────────────────────────────────────────────────────────

const ALT_OPTIONS = [
  "< 15,000 ft",
  "15,000 – 25,000 ft",
  "25,000 – 35,000 ft",
  "> 35,000 ft",
];

function altBracketIndex(altitude: number | string): number {
  const alt = typeof altitude === "number" ? altitude : parseInt(String(altitude)) || 30000;
  if (alt < 15000) return 0;
  if (alt < 25000) return 1;
  if (alt < 35000) return 2;
  return 3;
}

export const ALTITUDE_OPTIONS = ALT_OPTIONS;

export async function setupRound4(aircraft: Aircraft[]): Promise<void> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};
  const alive = Object.values(players)
    .filter((p: any) => p.status === "alive")
    .map((p: any) => p.id as string);

  const numTeams = Math.max(2, Math.ceil(alive.length / 2));
  const teams: Record<string, string[]> = {};
  for (let t = 0; t < numTeams; t++) teams[`team_${t}`] = [];
  alive.forEach((uid, i) => teams[`team_${i % numTeams}`].push(uid));

  const questions: Record<string, { question: string; options: string[]; correctIndex: number }> = {};
  Object.keys(teams).forEach((teamId, i) => {
    const ac = aircraft[i % aircraft.length];
    questions[teamId] = {
      question: `What is the approximate altitude of flight "${ac.callsign}"?`,
      options: ALT_OPTIONS,
      correctIndex: altBracketIndex(ac.altitude),
    };
  });

  // Pre-assign random bot answers into the initial answers map
  const initialAnswers: Record<string, number> = {};
  Object.entries(teams).forEach(([teamId, members]) => {
    members.forEach((uid) => {
      if (players[uid]?.isBot) {
        initialAnswers[uid] = Math.floor(Math.random() * 4);
      }
    });
  });

  await update(ref(database), {
    "gameState/round4/teams": teams,
    "gameState/round4/questions": questions,
    "gameState/round4/answers": initialAnswers,
    "gameState/round4/eliminated": {},
    "gameState/round4/phase": "answering",
  });
}

export async function resolveRound4(): Promise<string[]> {
  const [r4Snap, pSnap] = await Promise.all([
    get(ref(database, "gameState/round4")),
    get(ref(database, "players")),
  ]);
  const r4 = r4Snap.val() || {};
  const players = pSnap.val() || {};
  const teams: Record<string, string[]> = r4.teams || {};
  const questions: Record<string, any> = r4.questions || {};
  const answers: Record<string, number> = r4.answers || {};

  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

  Object.entries(teams).forEach(([teamId, members]) => {
    const q = questions[teamId];
    if (!q) return;

    const teamAnswers = members.map((uid) => answers[uid] ?? -1).filter((a) => a !== -1);
    const hasCorrect = teamAnswers.some((a) => a === q.correctIndex);
    const allSame = teamAnswers.length > 0 && teamAnswers.every((a) => a === teamAnswers[0]);
    const survives = hasCorrect || allSame;

    if (!survives) {
      members.forEach((uid) => {
        if (players[uid]?.status === "alive") {
          eliminated.push(uid);
          updates[`players/${uid}/status`] = "eliminated";
          updates[`gameState/round4/eliminated/${uid}`] = true;
        }
      });
    } else {
      members.forEach((uid) => {
        if (players[uid]?.status === "alive") {
          updates[`players/${uid}/survivedRounds`] = (players[uid].survivedRounds || 0) + 1;
        }
      });
    }
  });

  updates["gameState/round4/phase"] = "revealed";
  await update(ref(database), updates);
  return eliminated;
}

// ─────────────────────────────────────────────────────────────
// ROUND 5 — Deja Vu
// ─────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface R5Item { position: number; callsign: string; id: string }

export async function setupRound5(aircraft: Aircraft[]): Promise<void> {
  const items: R5Item[] = aircraft.map((ac, i) => ({
    position: i + 1,
    callsign: ac.callsign,
    id: ac.id,
  }));
  const shuffled = shuffle(items);

  await update(ref(database), {
    "gameState/round5/sequence": items,
    "gameState/round5/shuffled": shuffled,
    "gameState/round5/phase": "memorize",
    "gameState/round5/memorizationStartedAt": Date.now(),
    "gameState/round5/answers": {},
    "gameState/round5/eliminated": {},
    "gameState/round5/iteration": 1,
  });
}

export async function resolveRound5Iteration(): Promise<{
  eliminated: string[];
  survivors: string[];
  done: boolean;
}> {
  const [r5Snap, pSnap] = await Promise.all([
    get(ref(database, "gameState/round5")),
    get(ref(database, "players")),
  ]);
  const r5 = r5Snap.val() || {};
  const players = pSnap.val() || {};
  const sequence: R5Item[] = r5.sequence || [];
  const answers: Record<string, Record<string, number>> = r5.answers || {};

  const eliminated: string[] = [];
  const survivors: string[] = [];
  const updates: Record<string, any> = {};

  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive") return;

    let correct = false;
    if (p.isBot) {
      correct = Math.random() < 0.3; // 30% accuracy
    } else {
      const playerAns = answers[uid] || {};
      correct = sequence.every((item) => playerAns[item.id] === item.position);
    }

    if (!correct) {
      eliminated.push(uid);
      updates[`players/${uid}/status`] = "eliminated";
      updates[`gameState/round5/eliminated/${uid}`] = true;
    } else {
      survivors.push(uid);
    }
  });

  const done = survivors.length <= 1;

  if (!done) {
    // Prepare next iteration with same aircraft but new shuffle
    const nextItems: R5Item[] = sequence;
    const nextShuffled = shuffle(nextItems);
    updates["gameState/round5/shuffled"] = nextShuffled;
    updates["gameState/round5/phase"] = "memorize";
    updates["gameState/round5/memorizationStartedAt"] = Date.now();
    updates["gameState/round5/answers"] = {};
    updates["gameState/round5/iteration"] = (r5.iteration || 1) + 1;
  } else {
    updates["gameState/round5/phase"] = "done";
    if (survivors.length === 1) {
      updates[`players/${survivors[0]}/survivedRounds`] =
        (players[survivors[0]]?.survivedRounds || 0) + 1;
    }
  }

  await update(ref(database), updates);
  return { eliminated, survivors, done };
}

// ─────────────────────────────────────────────────────────────
// Game Flow
// ─────────────────────────────────────────────────────────────

export async function startGame(): Promise<void> {
  // Read current players
  const pSnap = await get(ref(database, "players"));
  const currentPlayers = pSnap.val() || {};

  // Fill with bots
  await fillBotsToMax(currentPlayers);

  // Re-read after bot fill
  const pSnap2 = await get(ref(database, "players"));
  const allPlayers = pSnap2.val() || {};

  // Reset all player statuses
  const resetUpdates: Record<string, any> = {};
  Object.keys(allPlayers).forEach((uid) => {
    resetUpdates[`players/${uid}/status`] = "alive";
    resetUpdates[`players/${uid}/survivedRounds`] = 0;
  });
  await update(ref(database), resetUpdates);

  // Fetch 3 aircraft
  const aircraft = await fetchThreeAircraft();
  await set(ref(database, "gameState/aircraftSnapshot"), aircraft);

  // Setup round 1
  await setupRound1(aircraft, allPlayers);

  // Advance status
  await update(ref(database), {
    "gameState/status": "round1",
    "gameState/roundStartedAt": Date.now(),
  });
}

export async function advanceToRound(
  round: "round2" | "round3" | "round4" | "round5" | "ended"
): Promise<void> {
  const acSnap = await get(ref(database, "gameState/aircraftSnapshot"));
  const aircraft: Aircraft[] = acSnap.val()
    ? Array.isArray(acSnap.val())
      ? acSnap.val()
      : Object.values(acSnap.val())
    : DEMO_AIRCRAFT_SNAPSHOT.slice(0, 3);

  if (round === "round4") await setupRound4(aircraft);
  if (round === "round5") await setupRound5(aircraft);

  await update(ref(database), {
    "gameState/status": round,
    "gameState/roundStartedAt": Date.now(),
  });
}

export async function resetToLobby(userId?: string): Promise<void> {
  const updates: Record<string, any> = {
    "gameState/status": "waiting",
    "gameState/roundStartedAt": null,
    "gameState/round1": null,
    "gameState/round2": null,
    "gameState/round3": null,
    "gameState/round4": null,
    "gameState/round5": null,
  };

  try {
    const pSnap = await get(ref(database, "players"));
    const allPlayers = pSnap.val() || {};
    Object.keys(allPlayers).forEach((uid) => {
      updates[`players/${uid}/status`] = "alive";
      updates[`players/${uid}/survivedRounds`] = 0;
    });
  } catch (e) {
    console.error("Error reading players for reset:", e);
  }

  if (userId) {
    updates[`players/${userId}/status`] = "alive";
    updates[`players/${userId}/survivedRounds`] = 0;
  }

  await update(ref(database), updates);
}
