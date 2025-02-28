import React, { useState, useEffect } from 'react';
import { useGameContext } from './GameProvider';
import { assignRoles, getRandomDefaultNames, generateId } from '@/utils/helpers';
import { PlusCircle, RefreshCw, X } from 'lucide-react';

export default function GameSetup() {
  const { updateGameState } = useGameContext();
  const [playerNames, setPlayerNames] = useState<string[]>(Array(10).fill(''));
  const [error, setError] = useState<string | null>(null);

  // Initialize with random default names
  useEffect(() => {
    const randomNames = getRandomDefaultNames(10);
    setPlayerNames(randomNames);
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    setError(null);
  };

  const randomizeNames = () => {
    const randomNames = getRandomDefaultNames(10);
    setPlayerNames(randomNames);
    setError(null);
  };

  const startGame = () => {
    // Validate names
    const validNames = playerNames.filter(name => name.trim() !== '');
    
    if (validNames.length !== 10) {
      setError('Please enter all 10 player names');
      return;
    }
    
    if (new Set(validNames).size !== 10) {
      setError('All player names must be unique');
      return;
    }

    try {
      // Assign roles and start game
      const players = assignRoles(validNames);
      
      // Create initial game log entry
      const logEntry = {
        id: generateId(),
        round: 1,
        phase: 'setup',
        action: 'Game started with 10 players.',
        timestamp: Date.now(),
      };
      
      updateGameState(prev => ({
        ...prev,
        players,
        phase: 'night',
        round: 1,
        gameLog: [logEntry],
      }));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Player Setup</h2>
      <p className="mb-4">Edit player names or start with the random default names:</p>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-2 mb-6">
        {playerNames.map((name, index) => (
          <div key={index} className="flex items-center">
            <span className="w-8 text-center">{index + 1}.</span>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder={`Player ${index + 1}`}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={randomizeNames}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Randomize Names
        </button>
        
        <button
          onClick={startGame}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}