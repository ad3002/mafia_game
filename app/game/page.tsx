'use client';

import React from 'react';
import { useGameContext } from '@/components/GameProvider';
import GameSetup from '@/components/GameSetup';
import NightPhase from '@/components/NightPhase';
import DayPhase from '@/components/DayPhase';
import VotingPhase from '@/components/VotingPhase';
import GameResults from '@/components/GameResults';
import GameHeader from '@/components/GameHeader';
import GameLog from '@/components/GameLog';

export default function GamePage() {
  const { gameState } = useGameContext();
  const { phase } = gameState;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GameHeader />
      
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-3/4">
              {phase === 'setup' && <GameSetup />}
              {phase === 'night' && <NightPhase />}
              {phase === 'day' && <DayPhase />}
              {phase === 'voting' && <VotingPhase />}
              {phase === 'results' && <GameResults />}
              
              {/* Voting results are now shown on a separate page */}
            </div>
            
            {/* Game Log (hide during setup) */}
            {phase !== 'setup' && (
              <div className="w-full md:w-1/4">
                <GameLog />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}