import React from 'react';
import { useGameContext } from './GameProvider';
import { Users, Moon, Sun, Vote, Trophy } from 'lucide-react';
import { GamePhase } from '@/types/game';

export default function GameHeader() {
  const { gameState } = useGameContext();
  const { phase, round } = gameState;
  
  const getPhaseIcon = () => {
    switch (phase) {
      case 'setup':
        return <Users className="h-5 w-5" />;
      case 'night':
        return <Moon className="h-5 w-5" />;
      case 'day':
        return <Sun className="h-5 w-5" />;
      case 'voting':
        return <Vote className="h-5 w-5" />;
      case 'results':
        return <Trophy className="h-5 w-5" />;
      default:
        return null;
    }
  };
  
  const getPhaseText = () => {
    switch (phase) {
      case 'setup':
        return 'Setup';
      case 'night':
        return 'Night';
      case 'day':
        return 'Day';
      case 'voting':
        return 'Voting';
      case 'results':
        return 'Results';
      default:
        return '';
    }
  };
  
  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mafia Game</h1>
        
        {(phase as GamePhase) !== 'setup' && (
          <div className="flex items-center">
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
              {getPhaseIcon()}
              <span className="ml-1 font-medium">{getPhaseText()}</span>
              {(phase as GamePhase) !== 'setup' && (phase as GamePhase) !== 'results' && (
                <span className="ml-1">Round {round}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}