export type ScreenId = 
  | 'home' 
  | 'dashboard' 
  | 'lobby' 
  | 'faq';

export type SuitType = 'DIAMONDS' | 'SPADES' | 'CLUBS' | 'HEARTS';

export interface Survivor {
  rank: string;
  codename: string;
  callsign: string;
  isCurrentUser?: boolean;
  avatarUrl: string;
  stagesCleared: number;
  totalStages: number;
  suit: SuitType;
  suitCategory: string;
  escapeScore: number;
  exfiltrationTime: string;
  lethalVector: string;
  status: 'ESCAPED' | 'PURGED' | 'ACTIVE';
  cycle: string;
}

export interface Player {
  id: string;
  name: string;
  suit: SuitType;
  lives: number;
  maxLives: number;
  score: number;
  status: 'ACTIVE' | 'SAFE' | 'IN FLIGHT' | 'PURGED S01' | 'PURGED S02' | 'PURGED S03' | 'PURGED S04' | 'PURGED S05';
  lethalReason?: string;
  avatarUrl?: string;
  heartRate?: number;
}

export interface AircraftTarget {
  id: string;
  callsign: string;
  squawk: string;
  type: string;
  altitude: number; // in feet
  groundSpeed: number; // in knots
  trackHeading: string;
  lat: number;
  lon: number;
  status: 'HOSTILE / ESCAPE' | 'CIVILIAN EN-ROUTE' | 'APPROACH RJTT' | 'CLIMBING';
  badge: string;
  radarX: number; // in SVG coord
  radarY: number;
  isEmergency?: boolean;
}

export interface StageInfo {
  id: string;
  stageNumber: number;
  code: string;
  name: string;
  suit: SuitType;
  suitSymbol: string;
  suitCategory: string;
  subTitle: string;
  tagline: string;
  trialType: string;
  clearanceLevel: string;
  initialCountdown: number; // seconds
  survivalQuota: string;
  description: string;
  rules: string[];
  imageUrl: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  tag: string;
  tagColor: 'primary' | 'error' | 'warning' | 'info' | 'dim';
  message: string;
}
