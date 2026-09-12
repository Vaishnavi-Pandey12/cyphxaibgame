import { database } from "@/lib/firebase";
import { ref, set } from "firebase/database";

export interface Aircraft {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number | string;
  speed: number;
  track: number;
  type: string;
  [key: string]: any;
}

export interface SyncAirspaceResult {
  success: boolean;
  count: number;
  aircraft: Aircraft[];
  message: string;
  timestamp: number;
}

/**
 * Fetches real-time airspace telemetry from our Next.js proxy route,
 * maps aircraft data to a clean telemetry schema,
 * and writes the array directly to Firebase RTDB at gameState/aircraftSnapshot.
 */
export async function syncAirspaceToFirebase(
  lat: number,
  lon: number,
  dist: number
): Promise<SyncAirspaceResult> {
  const timestamp = Date.now();

  try {
    const url = `/api/flights?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&dist=${encodeURIComponent(dist)}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Flight proxy responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawAircraftList = Array.isArray(data?.ac) ? data.ac : [];

    // Map to clean object { id: hex, callsign: flight, lat, lon, altitude: alt_baro, speed: gs, track, type: t }
    const mappedAircraft: Aircraft[] = rawAircraftList.map((item: any, index: number) => ({
      id: item.hex || `ac_${index}`,
      callsign: item.flight ? item.flight.trim() : (item.hex || `AC_${index + 1}`),
      lat: typeof item.lat === "number" ? item.lat : 0,
      lon: typeof item.lon === "number" ? item.lon : 0,
      altitude: item.alt_baro ?? 0,
      speed: typeof item.gs === "number" ? item.gs : 0,
      track: typeof item.track === "number" ? item.track : 0,
      type: item.t || "UNKNOWN",
    }));

    // Write array directly to Firebase Realtime Database at gameState/aircraftSnapshot
    const snapshotRef = ref(database, "gameState/aircraftSnapshot");
    await set(snapshotRef, mappedAircraft);

    return {
      success: true,
      count: mappedAircraft.length,
      aircraft: mappedAircraft,
      message: `Successfully synced ${mappedAircraft.length} aircraft telemetry targets to Firebase RTDB at gameState/aircraftSnapshot.`,
      timestamp,
    };
  } catch (error: any) {
    console.error("Airspace sync to Firebase failed:", error);
    throw new Error(error.message || "Failed to sync airspace telemetry to Firebase");
  }
}

/**
 * Hardcoded safe fallback snapshot for offline / demo mode
 */
export const DEMO_AIRCRAFT_SNAPSHOT: Aircraft[] = [
  { id: "a1b2c3", callsign: "SKY_NEXUS", lat: 40.7128, lon: -74.0060, altitude: 43000, speed: 495, track: 185, type: "B789" },
  { id: "b4c5d6", callsign: "NEO_GHOST", lat: 40.7580, lon: -73.9855, altitude: 31000, speed: 420, track: 92, type: "A359" },
  { id: "c7d8e9", callsign: "SHADOW_77", lat: 40.6892, lon: -74.0445, altitude: 38500, speed: 510, track: 270, type: "GLEX" },
  { id: "d0e1f2", callsign: "GLITCH_99", lat: 40.7829, lon: -73.9654, altitude: 16500, speed: 325, track: 45, type: "E75L" },
  { id: "e3f4a5", callsign: "ZERO_COOL", lat: 40.7484, lon: -73.9857, altitude: 27000, speed: 460, track: 315, type: "B77W" },
  { id: "f6a7b8", callsign: "ACID_BURN", lat: 40.7061, lon: -73.9969, altitude: 22000, speed: 380, track: 140, type: "A321" },
  { id: "a9b0c1", callsign: "PHREAK_88", lat: 40.7282, lon: -73.7949, altitude: 12000, speed: 280, track: 220, type: "CRJ9" },
  { id: "b2c3d4", callsign: "ALICE_SKY", lat: 40.6413, lon: -73.7781, altitude: 35000, speed: 475, track: 80, type: "A339" },
];

/**
 * Loads the hardcoded demo replay snapshot directly into Firebase gameState/aircraftSnapshot
 */
export async function syncDemoAirspaceToFirebase(): Promise<SyncAirspaceResult> {
  const timestamp = Date.now();
  const snapshotRef = ref(database, "gameState/aircraftSnapshot");
  await set(snapshotRef, DEMO_AIRCRAFT_SNAPSHOT);

  const sourceRef = ref(database, "gameState/dataSource");
  await set(sourceRef, "demo");

  return {
    success: true,
    count: DEMO_AIRCRAFT_SNAPSHOT.length,
    aircraft: DEMO_AIRCRAFT_SNAPSHOT,
    message: `Loaded ${DEMO_AIRCRAFT_SNAPSHOT.length} demo replay snapshot targets into Firebase RTDB.`,
    timestamp,
  };
}
