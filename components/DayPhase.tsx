import React, { useEffect, useState } from 'react';
import { useGameContext } from './GameProvider';
import PlayerCard from './PlayerCard';
import { Sun } from 'lucide-react';
import { checkGameEnd, generateId } from '@/utils/helpers';

export default function DayPhase() {
  const { gameState, updateGameState } = useGameContext();
  const { players, round } = gameState;

  useEffect(() => {
    // Check if game is over at start of day (after night kills)
    const gameStatus = checkGameEnd(gameState);
    
    if (gameStatus.isGameOver) {
      // Create game end log entry
      const gameEndLogEntry = {
        id: generateId(),
        round: round,
        phase: 'day',
        action: `Game Over! ${gameStatus.winner === 'town' ? 'Town' : 'Mafia'} wins!`,
        timestamp: Date.now(),
      };

      // Update game state to results phase
      updateGameState(prev => ({
        ...prev,
        phase: 'results',
        gameLog: [...prev.gameLog, gameEndLogEntry]
      }));
      return;
    }
  }, []);

  // Get eliminated players from the night phase
  const nightKills = gameState.gameLog
    .filter(log => 
      log.round === round && 
      log.phase === 'night' && 
      log.action.includes('eliminated')
    )
    .map(log => {
      const playerName = players.find(p => log.action.includes(p.name))?.name;
      return { name: playerName, action: log.action };
    });

  const startVoting = () => {
    const logEntry = {
      id: generateId(),
      round,
      phase: 'day',
      action: 'Day discussion ended. Voting phase started.',
      timestamp: Date.now(),
    };
    
    updateGameState(prev => ({
      ...prev,
      phase: 'voting',
      votes: {},
      gameLog: [...prev.gameLog, logEntry]
    }));
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="text-center mb-6">
        <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
        <h2 className="text-2xl font-bold">Day Phase - Round {round}</h2>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Last Night's Events:</h3>
        {nightKills.length > 0 ? (
          <div className="space-y-2">
            {nightKills.map((kill, index) => (
              <div key={index} className="p-3 border rounded-md bg-red-50">
                {kill.action}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 border rounded-md bg-green-50">
            No one was eliminated during the night.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
        {players.filter(p => p.isAlive).map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={startVoting}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Start Voting
        </button>
      </div>
    </div>
  );
}