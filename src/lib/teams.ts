import { database } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { Player } from "@/components/game/PlayerCard";

/**
 * Fisher-Yates algorithm for cryptographically random/uniform shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetches alive players, shuffles them, divides them into numberOfTeams,
 * distributes remainder sequentially starting from the first team,
 * and updates each player's teamId in Firebase.
 */
export async function assignTeams(numberOfTeams: number): Promise<{
  success: boolean;
  totalAssigned: number;
  teams: Record<string, string[]>;
  message: string;
}> {
  if (numberOfTeams <= 0) {
    throw new Error("Number of teams must be at least 1.");
  }

  const playersRef = ref(database, "players");
  const snapshot = await get(playersRef);
  const data = snapshot.val();

  if (!data) {
    return {
      success: false,
      totalAssigned: 0,
      teams: {},
      message: "No players found in the database.",
    };
  }

  // Convert Firebase players data to array
  let playersList: Player[] = [];
  if (Array.isArray(data)) {
    playersList = data
      .map((item, index) => ({
        id: item?.id ? String(item.id) : `p_${index}`,
        ...item,
      }))
      .filter(Boolean);
  } else if (typeof data === "object") {
    playersList = Object.entries(data).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  }

  // Filter only alive players
  const alivePlayers = playersList.filter(
    (p) => p && typeof p.status === "string" && p.status.toLowerCase() === "alive"
  );

  if (alivePlayers.length === 0) {
    return {
      success: false,
      totalAssigned: 0,
      teams: {},
      message: "No alive players found to assign.",
    };
  }

  // Randomly shuffle alive players
  const shuffledPlayers = shuffleArray(alivePlayers);

  // Divide into numberOfTeams and distribute remainder sequentially starting from Team 1
  // Round-robin distribution: index % numberOfTeams gives team index 0, 1, ..., (numberOfTeams - 1)
  // This automatically distributes evenly and assigns any remainder sequentially starting from Team 1.
  const updates: Record<string, string> = {};
  const teamAssignments: Record<string, string[]> = {};

  for (let t = 1; t <= numberOfTeams; t++) {
    teamAssignments[`Team ${t}`] = [];
  }

  shuffledPlayers.forEach((player, index) => {
    const teamNumber = (index % numberOfTeams) + 1;
    const teamId = `Team ${teamNumber}`;
    
    // Path within /players to update
    updates[`${player.id}/teamId`] = teamId;
    teamAssignments[teamId].push(player.alias || player.name || player.id);
  });

  // Commit updates to Firebase Realtime Database
  await update(playersRef, updates);

  return {
    success: true,
    totalAssigned: shuffledPlayers.length,
    teams: teamAssignments,
    message: `Successfully assigned ${shuffledPlayers.length} alive players across ${numberOfTeams} teams.`,
  };
}
