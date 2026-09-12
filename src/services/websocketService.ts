export type GameEvent = "STAGE_START"|"AIRCRAFT_UPDATE"|"TIMER_UPDATE"|"PLAYER_ACTION"|"ANSWER_SUBMITTED"|"PLAYER_ELIMINATED"|"STAGE_COMPLETE"|"PLAYER_SURVIVED"|"SESSION_RESET"|"CONNECTION_STATUS";
// Backend adapter boundary: the local prototype intentionally remains authoritative only for demo interactions.
export const websocketService = { connected:false, send: (event:GameEvent, payload:unknown) => { void event; void payload; } };
