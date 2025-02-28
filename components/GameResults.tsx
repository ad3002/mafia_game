import React from 'react';
import { useGameContext } from './GameProvider';
import PlayerCard from './PlayerCard';
import { Trophy, RotateCw, Home } from 'lucide-react';
import { assignRoles, generateId } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { GamePhase } from '@/types/game';

export default function GameResults() {
  const { gameState, updateGameState } = useGameContext();
  const { players } = gameState;
  const router = useRouter();

  // Get eliminated players in order
  const eliminationOrder = gameState.gameLog
    .filter(log => log.action.includes('eliminated') || log.action.includes('killed'))
    .map(log => {
      const playerName = players.find(p => log.action.includes(p.name))?.name;
      return { name: playerName, action: log.action };
    });

  const playAgainSamePlayers = () => {
    // Reassign roles and reset game
    const newPlayers = assignRoles(players.map(p => p.name));
    
    const logEntry = {
      id: generateId(),
      round: 1,
      phase: 'night' as GamePhase,
      action: 'New game started with the same players.',
      timestamp: Date.now(),
    };

    updateGameState(prev => ({
      ...prev,
      players: newPlayers,
      phase: 'night',
      round: 1,
      votes: {},
      nightAction: {},
      gameLog: [logEntry],
      showVotingResults: false,
      votingType: 'normal',
      tiedPlayerIds: [],
      confirmationVotes: {},
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
        <h3 className="text-xl text-gray-700 mb-6">
          {!players.some(p => (p.role === 'mafia' || p.role === 'don') && p.isAlive)
            ? 'Town Wins! All mafia members have been eliminated.'
            : 'Mafia Wins! They have matched or outnumbered the town.'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4">Final Player Roles</h4>
          <div className="grid grid-cols-2 gap-3">
            {players.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                showRole={true}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4">Elimination Order</h4>
          <div className="space-y-2">
            {eliminationOrder.map((elimination, index) => (
              <div 
                key={index} 
                className="p-2 bg-gray-50 rounded text-sm"
              >
                {index + 1}. {elimination.action}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={playAgainSamePlayers}
          className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RotateCw className="w-5 h-5 mr-2" />
          Play Again (Same Players)
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="w-5 h-5 mr-2" />
          New Game (New Players)
        </button>
      </div>
    </div>
  );
}