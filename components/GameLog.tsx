import React from 'react';
import { useGameContext } from './GameProvider';
import { LogEntry } from '@/types/game';
import { Clock, Moon, Sun, Vote, AlertCircle } from 'lucide-react';

export default function GameLog() {
  const { gameState } = useGameContext();
  const { gameLog } = gameState;

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getIconForPhase = (phase: string) => {
    switch (phase) {
      case 'night':
        return <Moon className="h-4 w-4 text-indigo-600" />;
      case 'day':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'voting':
        return <Vote className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Group logs by round
  const logsByRound: Record<number, LogEntry[]> = {};
  gameLog.forEach(log => {
    if (!logsByRound[log.round]) {
      logsByRound[log.round] = [];
    }
    logsByRound[log.round].push(log);
  });

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 h-full max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-3">Game Log</h3>
      
      {Object.keys(logsByRound).length === 0 ? (
        <p className="text-gray-500 text-center italic">Game events will appear here</p>
      ) : (
        Object.entries(logsByRound)
          .sort(([roundA], [roundB]) => Number(roundB) - Number(roundA))
          .map(([round, logs]) => (
            <div key={round} className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2 pb-1 border-b">
                Round {round}
              </h4>
              <ul className="space-y-2">
                {logs
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map(log => (
                    <li key={log.id} className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        {getIconForPhase(log.phase)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{log.action}</p>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))
      )}
    </div>
  );
}