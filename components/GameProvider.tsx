import React, { createContext, useState, useContext } from 'react';
import { GameState, GameContext as GameContextType } from '@/types/game';
import { generateId } from '@/utils/helpers';

// Initial game state
const initialGameState: GameState = {
  players: [],
  phase: 'setup',
  round: 0,
  votes: {},
  nightAction: {},
  gameLog: [],
  showVotingResults: false,
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | undefined>();

  const updateGameState = (updater: (prev: GameState) => GameState) => {
    setGameState((prev) => updater(prev));
  };

  const value = {
    gameState,
    updateGameState,
    currentPlayerId,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}