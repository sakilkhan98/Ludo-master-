export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface TokenState {
  color: PlayerColor;
  index: number; // 0, 1, 2, 3
  stepCount: number; // 0 = yard, 1-51 = outer track, 52-56 = home path, 57 = home (completed)
}

export interface PlayerState {
  uid: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  colorIndex: number; // 0: red, 1: green, 2: yellow, 3: blue
  isReady: boolean;
  isHost: boolean;
  isOnline: boolean;
  lastActive: number; // timestamp
}

export interface DiceState {
  value: number; // 1 to 6
  rolled: boolean;
  rolledBy: string | null; // uid
  canRoll: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  text: string;
  timestamp: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  language: 'en' | 'es' | 'hi' | 'bn';
  theme: 'light' | 'dark';
}

export interface RoomState {
  roomId: string;
  hostId: string;
  players: Record<string, PlayerState>; // uid -> PlayerState
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers?: number;
  turnPlayerId: string | null; // UID of player whose turn it is
  dice: DiceState;
  boardState: Record<PlayerColor, number[]>; // color -> [t0, t1, t2, t3] stepCounts
  chat: ChatMessage[];
  winnerId: string | null;
  winnerName: string | null;
  winHistory: string[]; // List of color UIDs in order of finishing
  createdAt: number;
  lastActivity: number;
  hasRollExtraTurn: boolean; // flag if current player got extra turn from rolling 6 or cutting
}

export interface UserStats {
  userId: string;
  name: string;
  avatar: string;
  wins: number;
  losses: number;
  ranking: number;
  totalGames: number;
  createdAt: number;
}

export interface MatchRecord {
  matchId: string;
  players: { uid: string; name: string; avatar: string; color: PlayerColor }[];
  winnerId: string;
  winnerName: string;
  date: number;
  mode: 'offline' | 'online';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progressMax: number;
  progressCurrent: number;
}
