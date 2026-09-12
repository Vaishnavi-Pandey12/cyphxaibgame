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
