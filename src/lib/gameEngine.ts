import { database } from "@/lib/firebase";
import { ref, set, get, update } from "firebase/database";
import { Aircraft } from "@/lib/airplanes";

const TOTAL_BOTS = 19;
const ROUND_DURATION_MS = 60_000; // 1 minute
void ROUND_DURATION_MS;

function generateDynamicTelemetry(index: number): Aircraft {
  const seed = Date.now() + index * 1337;
  const hex = Math.floor(Math.abs(seed) % 16777215).toString(16).toUpperCase().padStart(6, "0");
  const carriers = ["JL", "NH", "SQ", "BA", "AF", "DL", "UA", "LH"];
  const flightNum = 100 + (Math.abs(seed >> 3) % 899);
  return {
    id: hex,
    callsign: `${carriers[index % carriers.length]}${flightNum}`,
    lat: +(35.6895 + ((seed % 100) - 50) * 0.005).toFixed(4),
    lon: +(139.6917 + (((seed >> 2) % 100) - 50) * 0.005).toFixed(4),
    altitude: 20000 + (Math.abs(seed >> 3) % 200) * 100,
    speed: 360 + (Math.abs(seed >> 5) % 140),
    track: Math.abs(seed >> 6) % 360,
    type: ["B77W", "B789", "A359", "A339", "B738"][index % 5],
  };
}

// ─────────────────────────────────────────────────────────────
// Aircraft Fetching (used in rounds 2, 3, 5)
// ─────────────────────────────────────────────────────────────

export async function fetchThreeAircraft(): Promise<Aircraft[]> {
  try {
    const res = await fetch(`/api/flights?lat=35.6895&lon=139.6917&dist=100`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const raw: any[] = Array.isArray(data?.ac) ? data.ac : [];
    const mapped: Aircraft[] = raw
      .filter((item) => item.flight && typeof item.alt_baro === "number")
      .map((item, i) => ({
        id: item.hex || `ac_${i}`,
        callsign: item.flight.trim(),
        lat: typeof item.lat === "number" ? item.lat : 0,
        lon: typeof item.lon === "number" ? item.lon : 0,
        altitude: item.alt_baro,
        speed: typeof item.gs === "number" ? item.gs : 400,
        track: typeof item.track === "number" ? item.track : 180,
        type: item.t || "B738",
      }));
    const result: Aircraft[] = [];
    for (let i = 0; i < 3; i++) result.push(mapped[i] ?? generateDynamicTelemetry(i));
    return result;
  } catch {
    return [generateDynamicTelemetry(0), generateDynamicTelemetry(1), generateDynamicTelemetry(2)];
  }
}

// ─────────────────────────────────────────────────────────────
// Countries API (Round 1)
// ─────────────────────────────────────────────────────────────

export interface CountryData {
  name: string;        // common name
  capital: string;
  currency: string;    // currency name
  currencyCode: string;
  population: number;
  flag: string;        // emoji or url
}

function popRange(pop: number): string {
  if (pop < 1_000_000) return "< 1 million";
  if (pop < 10_000_000) return "1–10 million";
  if (pop < 50_000_000) return "10–50 million";
  if (pop < 200_000_000) return "50–200 million";
  return "> 200 million";
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchCountriesData(): Promise<CountryData[]> {
  try {
    const res = await fetch("/api/countries");
    if (!res.ok) throw new Error("Countries API error");
    const data: any[] = await res.json();
    const valid = data.filter(
      (c) =>
        c.name?.common &&
        c.capital?.[0] &&
        c.currencies &&
        Object.keys(c.currencies).length > 0 &&
        c.population > 100000
    );
    const shuffled = shuffleArray(valid).slice(0, 20);
    return shuffled.map((c) => {
      const currencyCode = Object.keys(c.currencies)[0];
      const currencyName = c.currencies[currencyCode]?.name || currencyCode;
      return {
        name: c.name.common,
        capital: c.capital[0],
        currency: currencyName,
        currencyCode,
        population: c.population,
        flag: c.flags?.emoji || "🏳️",
      };
    });
  } catch {
    // Fallback static list
    return FALLBACK_COUNTRIES.slice(0, 20);
  }
}

const FALLBACK_COUNTRIES: CountryData[] = [
  { name: "Japan", capital: "Tokyo", currency: "Japanese yen", currencyCode: "JPY", population: 125700000, flag: "🇯🇵" },
  { name: "Brazil", capital: "Brasília", currency: "Brazilian real", currencyCode: "BRL", population: 214300000, flag: "🇧🇷" },
  { name: "Germany", capital: "Berlin", currency: "Euro", currencyCode: "EUR", population: 83200000, flag: "🇩🇪" },
  { name: "Egypt", capital: "Cairo", currency: "Egyptian pound", currencyCode: "EGP", population: 102300000, flag: "🇪🇬" },
  { name: "Canada", capital: "Ottawa", currency: "Canadian dollar", currencyCode: "CAD", population: 38000000, flag: "🇨🇦" },
  { name: "Argentina", capital: "Buenos Aires", currency: "Argentine peso", currencyCode: "ARS", population: 45200000, flag: "🇦🇷" },
  { name: "South Korea", capital: "Seoul", currency: "South Korean won", currencyCode: "KRW", population: 51700000, flag: "🇰🇷" },
  { name: "Nigeria", capital: "Abuja", currency: "Nigerian naira", currencyCode: "NGN", population: 206100000, flag: "🇳🇬" },
  { name: "Mexico", capital: "Mexico City", currency: "Mexican peso", currencyCode: "MXN", population: 128900000, flag: "🇲🇽" },
  { name: "Sweden", capital: "Stockholm", currency: "Swedish krona", currencyCode: "SEK", population: 10400000, flag: "🇸🇪" },
  { name: "Thailand", capital: "Bangkok", currency: "Thai baht", currencyCode: "THB", population: 69800000, flag: "🇹🇭" },
  { name: "Poland", capital: "Warsaw", currency: "Polish złoty", currencyCode: "PLN", population: 37900000, flag: "🇵🇱" },
  { name: "Colombia", capital: "Bogotá", currency: "Colombian peso", currencyCode: "COP", population: 50400000, flag: "🇨🇴" },
  { name: "Kenya", capital: "Nairobi", currency: "Kenyan shilling", currencyCode: "KES", population: 53800000, flag: "🇰🇪" },
  { name: "Vietnam", capital: "Hanoi", currency: "Vietnamese đồng", currencyCode: "VND", population: 97300000, flag: "🇻🇳" },
  { name: "Greece", capital: "Athens", currency: "Euro", currencyCode: "EUR", population: 10700000, flag: "🇬🇷" },
  { name: "Chile", capital: "Santiago", currency: "Chilean peso", currencyCode: "CLP", population: 19100000, flag: "🇨🇱" },
  { name: "Romania", capital: "Bucharest", currency: "Romanian leu", currencyCode: "RON", population: 19100000, flag: "🇷🇴" },
  { name: "Philippines", capital: "Manila", currency: "Philippine peso", currencyCode: "PHP", population: 109600000, flag: "🇵🇭" },
  { name: "Morocco", capital: "Rabat", currency: "Moroccan dirham", currencyCode: "MAD", population: 37100000, flag: "🇲🇦" },
];

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
  const humanCount = Object.values(currentPlayers).filter((p: any) => !p.isBot).length;
  // Bots fill up to humanCount + 19 total (19 bots per spec), but never exceed 20 total
  const totalTarget = Math.min(20, humanCount + TOTAL_BOTS);
  const currentCount = Object.keys(currentPlayers).length;
  const botsNeeded = Math.max(0, totalTarget - currentCount);
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
      lives: 3,
      score: 0,
      joinedAt: Date.now() + i * 10,
    };
  }
  await update(ref(database), updates);
}

// ─────────────────────────────────────────────────────────────
// ROUND 1 — Country Seat Selection
// ─────────────────────────────────────────────────────────────

export async function setupRound1WithCountries(
  countries: CountryData[]
): Promise<void> {
  // Pick one random country as the "safe" seat
  const safeIndex = Math.floor(Math.random() * 20);
  const safeCountry = countries[safeIndex];

  const seatCountries = countries.map((c, i) => ({
    index: i,
    name: c.name,
    flag: c.flag,
    isSafe: i === safeIndex,
  }));

  await update(ref(database), {
    "gameState/round1/seatCountries": seatCountries,
    "gameState/round1/safeIndex": safeIndex,
    "gameState/round1/hintCountry": {
      name: safeCountry.name,
      capital: safeCountry.capital,
      currency: safeCountry.currency,
      currencyCode: safeCountry.currencyCode,
      populationRange: popRange(safeCountry.population),
      flag: safeCountry.flag,
    },
    "gameState/round1/lockedSeats": {},
    "gameState/round1/botSeats": {},
    "gameState/round1/eliminated": {},
    "gameState/round1/phase": "selecting",
    "gameState/round1/botsSeated": false,
  });
}

/** Called after human timer expires — bots now pick seats from remaining */
export async function assignBotSeatsRound1(): Promise<void> {
  const [r1Snap, pSnap] = await Promise.all([
    get(ref(database, "gameState/round1")),
    get(ref(database, "players")),
  ]);
  const r1 = r1Snap.val() || {};
  const players = pSnap.val() || {};

  const safeIndex: number = r1.safeIndex ?? 0;
  const lockedSeats: Record<string, number> = r1.lockedSeats || {};
  const usedIndices = new Set<number>(Object.values(lockedSeats));

  const bots = Object.values(players).filter((p: any) => p.isBot && p.status === "alive");
  const allIndices = Array.from({ length: 20 }, (_, i) => i);
  const botSeats: Record<string, number> = {};

  bots.forEach((bot: any) => {
    // 50% chance bots pick safe seat (competition), 50% random
    const wantSafe = Math.random() < 0.5 && !usedIndices.has(safeIndex);
    let chosen: number;
    if (wantSafe) {
      chosen = safeIndex;
    } else {
      const available = allIndices.filter((i) => !usedIndices.has(i));
      chosen = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : allIndices[Math.floor(Math.random() * 20)];
    }
    usedIndices.add(chosen);
    botSeats[bot.id] = chosen;
  });

  await update(ref(database), {
    "gameState/round1/botSeats": botSeats,
    "gameState/round1/botsSeated": true,
  });
}

export async function resolveRound1(): Promise<string[]> {
  const [r1Snap, pSnap] = await Promise.all([
    get(ref(database, "gameState/round1")),
    get(ref(database, "players")),
  ]);
  const r1 = r1Snap.val() || {};
  const players = pSnap.val() || {};

  const safeIndex: number = r1.safeIndex ?? -1;
  const locked: Record<string, number> = {
    ...(r1.botSeats || {}),
    ...(r1.lockedSeats || {}),
  };

  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive") return;
    const seatIndex = locked[uid];
    // Eliminated if no seat, or seat is not the safe one
    if (seatIndex === undefined || seatIndex === null || seatIndex !== safeIndex) {
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
// ROUND 2 — Fishing (unchanged logic, uses aircraft API)
// ─────────────────────────────────────────────────────────────

export function computeFlashlightX(aircraft: Aircraft[], roundStartedAt: number): number {
  const elapsed = Date.now() - roundStartedAt;
  const steps = Math.floor(elapsed / 5000);
  const baseX = Math.floor((typeof aircraft[1]?.speed === "number" ? aircraft[1].speed : 400) % 10);
  return (baseX + steps) % 10;
}

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
// ROUND 3 — Redline + Lives
// ─────────────────────────────────────────────────────────────

export function computeActiveLaserCols(aircraft: Aircraft[], roundStartedAt: number): number[] {
  const elapsed = Date.now() - roundStartedAt;
  const cycle = Math.floor(elapsed / 2000);
  const track = typeof aircraft[2]?.track === "number" ? aircraft[2].track : 180;
  const base = Math.floor(track % 10);
  return [(base + cycle) % 10, (base + cycle + 3) % 10, (base + cycle + 6) % 10];
}

export async function setupRound3Lives(): Promise<void> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};
  const updates: Record<string, any> = {};

  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status === "alive") {
      // Give all alive players 3 lives at round start
      updates[`players/${uid}/lives`] = 3;
    }
  });

  if (Object.keys(updates).length > 0) await update(ref(database), updates);
}

export async function deductLife(uid: string): Promise<number> {
  const snap = await get(ref(database, `players/${uid}/lives`));
  const currentLives = snap.val() ?? 3;
  const newLives = Math.max(0, currentLives - 1);
  const updates: Record<string, any> = { [`players/${uid}/lives`]: newLives };
  if (newLives <= 0) {
    updates[`players/${uid}/status`] = "eliminated";
    updates[`gameState/round3/eliminated/${uid}`] = true;
  }
  await update(ref(database), updates);
  return newLives;
}

export async function resolveRound3(): Promise<string[]> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};
  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

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
// ROUND 4 — Individual Rapid Fire MCQ
// ─────────────────────────────────────────────────────────────

export const RAPID_FIRE_QUESTIONS: Array<{
  question: string;
  options: string[];
  correctIndex: number;
}> = [
  { question: "What is Arisu's first name?", options: ["Ryohei", "Yuzuha", "Hikari", "Suguru"], correctIndex: 0 },
  { question: "What game does Arisu play professionally?", options: ["Chess", "Go", "Gaming", "Shogi"], correctIndex: 2 },
  { question: "Who is Arisu's best friend?", options: ["Chishiya", "Karube", "Aguni", "Hatter"], correctIndex: 1 },
  { question: "What is Usagi's first name?", options: ["Hikari", "Momoka", "Yuzuha", "Enji"], correctIndex: 2 },
  { question: "What sport was Usagi's father involved in?", options: ["Climbing", "Swimming", "Mountaineering", "Running"], correctIndex: 2 },
  { question: "Who is known as the 'Beach' leader?", options: ["Aguni", "Chishiya", "Hatter", "Niragi"], correctIndex: 2 },
  { question: "What is Chishiya's profession?", options: ["Engineer", "Lawyer", "Doctor", "Soldier"], correctIndex: 2 },
  { question: "What card suit represents physical games?", options: ["Hearts", "Diamonds", "Clubs", "Spades"], correctIndex: 3 },
  { question: "What card suit represents intelligence games?", options: ["Spades", "Diamonds", "Hearts", "Clubs"], correctIndex: 1 },
  { question: "What card suit represents teamwork games?", options: ["Hearts", "Diamonds", "Clubs", "Spades"], correctIndex: 2 },
  { question: "What card suit represents psychological games?", options: ["Spades", "Clubs", "Diamonds", "Hearts"], correctIndex: 3 },
  { question: "What number card is the first game Arisu enters?", options: ["Two", "Three", "Five", "Seven"], correctIndex: 1 },
  { question: "What is the name of the place where players gather?", options: ["Arena", "Stadium", "Beach", "Shore"], correctIndex: 2 },
  { question: "Who is known for wearing a bucket hat?", options: ["Aguni", "Chishiya", "Niragi", "Hatter"], correctIndex: 3 },
  { question: "What is Kuina's first name?", options: ["Momoka", "Yuzuha", "Hikari", "Enji"], correctIndex: 2 },
  { question: "What weapon does Aguni commonly use?", options: ["Bow", "Knife", "Gun", "Sword"], correctIndex: 2 },
  { question: "What is the name of the militant group at the Beach?", options: ["Rangers", "Militants", "Snipers", "Guards"], correctIndex: 1 },
  { question: "Who is the Beach's Hatter?", options: ["Niragi", "Aguni", "Chishiya", "Hatter"], correctIndex: 3 },
  { question: "What color is Chishiya's hoodie?", options: ["White", "Black", "Red", "Yellow"], correctIndex: 3 },
  { question: "What is Niragi's first name?", options: ["Enji", "Ryohei", "Suguru", "Hikari"], correctIndex: 2 },
  { question: "Who is Arisu's romantic interest?", options: ["Kuina", "Momoka", "Usagi", "Enji"], correctIndex: 2 },
  { question: "What animal is associated with Usagi's name?", options: ["Fox", "Wolf", "Cat", "Rabbit"], correctIndex: 3 },
  { question: "Who is the Beach's dealer hunter?", options: ["Hatter", "Niragi", "Aguni", "Chishiya"], correctIndex: 2 },
  { question: "What game involves a witch hunt?", options: ["Sacrifice", "Witchhunt", "Betrayal", "Deceive"], correctIndex: 1 },
  { question: "What is the name of the girl accused of being the witch?", options: ["Usagi", "Kuina", "Momoka", "Enji"], correctIndex: 2 },
  { question: "Which character is famous for saying very little?", options: ["Aguni", "Hatter", "Chishiya", "Niragi"], correctIndex: 2 },
  { question: "What suit is the King of Clubs?", options: ["Hearts", "Spades", "Diamonds", "Clubs"], correctIndex: 3 },
  { question: "Who is the Jack of Hearts?", options: ["Hatter", "Aguni", "Enji", "Chishiya"], correctIndex: 2 },
  { question: "What suit is the King of Spades?", options: ["Hearts", "Spades", "Clubs", "Diamonds"], correctIndex: 1 },
  { question: "What is the mysterious world's ultimate challenge called?", options: ["Survival", "Borderland", "Cipher", "Terminus"], correctIndex: 1 },
];

export async function setupRound4RapidFire(): Promise<void> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};

  // Shuffle questions for the round
  const shuffledQ = shuffleArray([...RAPID_FIRE_QUESTIONS]);

  // Initialize scores
  const updates: Record<string, any> = {};
  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive") return;
    updates[`players/${uid}/score`] = 0;
    // Bot: simulate a random score
    if (p.isBot) {
      const botScore = Math.floor(Math.random() * 20) + 5; // 5–24
      updates[`players/${uid}/score`] = botScore;
    }
  });

  await update(ref(database), {
    "gameState/round4/questions": shuffledQ,
    "gameState/round4/currentQuestionIndex": 0,
    "gameState/round4/phase": "answering",
    "gameState/round4/eliminated": {},
    "gameState/round4/answers": {},
    ...updates,
  });
}

export async function resolveRound4RapidFire(): Promise<string[]> {
  const pSnap = await get(ref(database, "players"));
  const players = pSnap.val() || {};

  // Get alive human players sorted by score desc
  const alivePlayers = Object.entries(players)
    .filter(([, p]: [string, any]) => p.status === "alive" && !p.isBot)
    .sort(([, a]: [string, any], [, b]: [string, any]) => (b.score || 0) - (a.score || 0));

  const top4Uids = new Set(alivePlayers.slice(0, 4).map(([uid]) => uid));

  const eliminated: string[] = [];
  const updates: Record<string, any> = {};

  Object.entries(players).forEach(([uid, p]: [string, any]) => {
    if (p.status !== "alive") return;
    if (p.isBot) {
      // Eliminate all bots in round 4
      eliminated.push(uid);
      updates[`players/${uid}/status`] = "eliminated";
      updates[`gameState/round4/eliminated/${uid}`] = true;
    } else if (!top4Uids.has(uid)) {
      eliminated.push(uid);
      updates[`players/${uid}/status`] = "eliminated";
      updates[`gameState/round4/eliminated/${uid}`] = true;
    } else {
      updates[`players/${uid}/survivedRounds`] = (p.survivedRounds || 0) + 1;
    }
  });

  updates["gameState/round4/phase"] = "revealed";
  await update(ref(database), updates);
  return eliminated;
}

// ─────────────────────────────────────────────────────────────
// ROUND 5 — Deja Vu (Aircraft sequence memory)
// ─────────────────────────────────────────────────────────────

export interface R5Item {
  position: number;
  callsign: string;
  id: string;
  planeId: string;
  altitude: number;
  speed: number;
}

export async function setupRound5(aircraft: Aircraft[]): Promise<void> {
  const items: R5Item[] = aircraft.map((ac, i) => ({
    position: i + 1,
    callsign: ac.callsign,
    id: ac.id,
    planeId: ac.id,
    altitude: typeof ac.altitude === "number" ? ac.altitude : parseInt(String(ac.altitude)) || 30000,
    speed: ac.speed,
  }));
  const shuffled = shuffleArray(items);

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
      correct = Math.random() < 0.3;
    } else {
      const playerAns = answers[uid] || {};
      correct = sequence.every((item) => playerAns[item.planeId] === item.position);
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
    // New shuffle for next iteration — critically reset phase to "memorize"
    const nextShuffled = shuffleArray([...sequence]);
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
  const pSnap = await get(ref(database, "players"));
  const currentPlayers = pSnap.val() || {};

  await fillBotsToMax(currentPlayers);

  const pSnap2 = await get(ref(database, "players"));
  const allPlayers = pSnap2.val() || {};

  const resetUpdates: Record<string, any> = {};
  Object.keys(allPlayers).forEach((uid) => {
    resetUpdates[`players/${uid}/status`] = "alive";
    resetUpdates[`players/${uid}/survivedRounds`] = 0;
    resetUpdates[`players/${uid}/lives`] = 3;
    resetUpdates[`players/${uid}/score`] = 0;
  });
  await update(ref(database), resetUpdates);

  // Fetch aircraft for rounds 2/3/5
  const aircraft = await fetchThreeAircraft();
  await set(ref(database, "gameState/aircraftSnapshot"), aircraft);

  // Fetch countries for round 1
  const countries = await fetchCountriesData();
  await setupRound1WithCountries(countries);

  await update(ref(database), {
    "gameState/status": "round1",
    "gameState/roundStartedAt": Date.now(),
  });
}

export async function advanceToRound(
  round: "round2" | "round3" | "round4" | "round5" | "ended"
): Promise<void> {
  const acSnap = await get(ref(database, "gameState/aircraftSnapshot"));
  const val = acSnap.val();
  let aircraft: Aircraft[] = [];
  if (Array.isArray(val) && val.length >= 3) {
    aircraft = val.slice(0, 3);
  } else if (val && typeof val === "object") {
    aircraft = Object.values(val).slice(0, 3) as Aircraft[];
  }
  if (aircraft.length < 3) {
    aircraft = [generateDynamicTelemetry(0), generateDynamicTelemetry(1), generateDynamicTelemetry(2)];
  }

  if (round === "round3") await setupRound3Lives();
  if (round === "round4") await setupRound4RapidFire();
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
      updates[`players/${uid}/lives`] = 3;
      updates[`players/${uid}/score`] = 0;
    });
  } catch (e) {
    console.error("Error reading players for reset:", e);
  }

  if (userId) {
    updates[`players/${userId}/status`] = "alive";
    updates[`players/${userId}/survivedRounds`] = 0;
    updates[`players/${userId}/lives`] = 3;
    updates[`players/${userId}/score`] = 0;
  }

  await update(ref(database), updates);
}
