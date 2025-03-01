import React, { useState } from 'react';
import { useGameContext } from './GameProvider';
import PlayerCard from './PlayerCard';
import { Moon, X, AlertTriangle, Shield, Check } from 'lucide-react';
import { checkGameEnd, generateId } from '@/utils/helpers';

export default function NightPhase() {
  const { gameState, updateGameState } = useGameContext();
  const { players, round } = gameState;

  const [currentRole, setCurrentRole] = useState<'mafia' | 'sheriff'>('mafia');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showInvestigationResult, setShowInvestigationResult] = useState(false);
  const [isMafia, setIsMafia] = useState(false);
  const [investigatedPlayerName, setInvestigatedPlayerName] = useState('');

  const alivePlayers = players.filter(p => p.isAlive);
  const mafiaPlayers = players.filter(p => (p.role === 'mafia' || p.role === 'don') && p.isAlive);
  const sheriffPlayer = players.find(p => p.role === 'sheriff' && p.isAlive);

  const handleConfirm = () => {
    if (!selectedPlayer) return;

    if (currentRole === 'mafia') {
      // Update player state to mark as eliminated
      const updatedPlayers = players.map(player => {
        if (player.id === selectedPlayer) {
          return { ...player, isAlive: false };
        }
        return player;
      });

      const eliminatedPlayer = players.find(p => p.id === selectedPlayer);
      const logEntry = {
        id: generateId(),
        round,
        phase: 'night' as const,
        action: `${eliminatedPlayer?.name} was eliminated during the night.`,
        timestamp: Date.now(),
      };

      // Check if game is over after mafia kill
      const gameStatus = checkGameEnd({
        ...gameState,
        players: updatedPlayers
      });

      if (gameStatus.isGameOver) {
        const gameEndLogEntry = {
          id: generateId(),
          round: round,
          phase: 'night' as const,
          action: `Game Over! ${gameStatus.winner === 'town' ? 'Town' : 'Mafia'} wins!`,
          timestamp: Date.now(),
        };

        updateGameState(prev => ({
          ...prev,
          players: updatedPlayers,
          phase: 'results',
          gameLog: [...prev.gameLog, logEntry, gameEndLogEntry],
          nightAction: { ...prev.nightAction, mafia: selectedPlayer }
        }));
      } else {
        // Game continues - move to sheriff or day phase
        const nextPhase = sheriffPlayer ? 'night' : 'day';
        updateGameState(prev => ({
          ...prev,
          players: updatedPlayers,
          phase: nextPhase,
          gameLog: [...prev.gameLog, logEntry],
          nightAction: { ...prev.nightAction, mafia: selectedPlayer }
        }));
        if (sheriffPlayer) {
          setCurrentRole('sheriff');
          setSelectedPlayer(null);
        }
      }
    } else if (currentRole === 'sheriff') {
      // Sheriff investigation
      const investigatedPlayer = players.find(p => p.id === selectedPlayer);
      const isMafiaRole = investigatedPlayer?.role === 'mafia' || investigatedPlayer?.role === 'don';

      const logEntry = {
        id: generateId(),
        round,
        phase: 'night' as const,
        action: `Sheriff investigated ${investigatedPlayer?.name} and found ${isMafiaRole ? 'a Mafia member' : 'an innocent citizen'}.`,
        timestamp: Date.now(),
      };

      setIsMafia(isMafiaRole);
      setInvestigatedPlayerName(investigatedPlayer?.name || '');
      setShowInvestigationResult(true);

      // Add log entry but don't change phase yet
      updateGameState(prev => ({
        ...prev,
        gameLog: [...prev.gameLog, logEntry],
        nightAction: { ...prev.nightAction, sheriff: selectedPlayer }
      }));
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId);
  };

  const handleCloseInvestigation = () => {
    setShowInvestigationResult(false);
    setSelectedPlayer(null);
    // Move to day phase after closing the investigation result
    updateGameState(prev => ({
      ...prev,
      phase: 'day'
    }));
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Investigation Result Modal */}
      {showInvestigationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-lg max-w-md w-full p-6 transform transition-all duration-200 ease-in-out ${isMafia ? 'border-2 border-red-500' : 'border-2 border-green-500'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Investigation Result</h3>
              <button 
                onClick={handleCloseInvestigation}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-center p-4 mb-4">
              {isMafia ? (
                <div className="bg-red-100 text-red-800 rounded-lg p-4 flex items-center transform transition-all duration-200 hover:scale-105">
                  <AlertTriangle className="h-8 w-8 mr-3 text-red-600 animate-pulse" />
                  <div>
                    <p className="font-bold text-lg mb-1">{investigatedPlayerName} is a Mafia member!</p>
                    <p className="text-sm opacity-75">This player is part of the Mafia team.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-100 text-green-800 rounded-lg p-4 flex items-center transform transition-all duration-200 hover:scale-105">
                  <Shield className="h-8 w-8 mr-3 text-green-600 animate-pulse" />
                  <div>
                    <p className="font-bold text-lg mb-1">{investigatedPlayerName} is not a Mafia member.</p>
                    <p className="text-sm opacity-75">This player is innocent.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <button
                onClick={handleCloseInvestigation}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform transition-all duration-200 hover:scale-105 flex items-center justify-center mx-auto"
              >
                <Check className="h-5 w-5 mr-2" />
                Continue to Day Phase
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <Moon className="h-8 w-8 mx-auto mb-2 text-indigo-900" />
        <h2 className="text-2xl font-bold">Night Phase</h2>
        <p className="text-gray-600">
          {currentRole === 'mafia' 
            ? 'Mafia decides who to eliminate'
            : 'Sheriff investigates a player'}
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2 capitalize">{currentRole} action:</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {alivePlayers
            .filter(p => {
              // Mafia can't kill mafia
              if (currentRole === 'mafia') {
                return p.role !== 'mafia' && p.role !== 'don';
              }
              // Sheriff can investigate anyone else
              return p.role !== 'sheriff';
            })
            .map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                showRole={false}
                isSelected={selectedPlayer === player.id}
                onClick={() => handlePlayerSelect(player.id)}
              />
            ))}
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={handleConfirm}
          disabled={!selectedPlayer}
          className={`
            px-6 py-2 rounded-lg text-white 
            ${!selectedPlayer 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {currentRole === 'mafia' && sheriffPlayer 
            ? 'Next Role' 
            : 'End Night Phase'}
        </button>
      </div>
    </div>
  );
}