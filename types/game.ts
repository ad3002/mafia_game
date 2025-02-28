export type PlayerRole = 'civilian' | 'sheriff' | 'mafia' | 'don';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  isAlive: boolean;
}

export type GamePhase = 'setup' | 'night' | 'day' | 'voting' | 'results';

export type VotingType = 'normal' | 'runoff' | 'confirmation';

export type LogEntry = {
  id: string;
  round: number;
  phase: GamePhase; 
  action: string;
  timestamp: number;
};

export interface GameState {
  players: Player[];
  phase: GamePhase;
  round: number;
  votes: Record<string, string>; // voterId -> votedForId
  nightAction: Record<string, string>; // actorId -> targetId
  gameLog: LogEntry[];
  showVotingResults: boolean;
  votingType?: VotingType;
  tiedPlayerIds?: string[]; // IDs of players who are tied in votes
  confirmationVotes?: Record<string, boolean>; // voterId -> true (exile) or false (keep)
}

export interface GameContext {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  currentPlayerId?: string;
}