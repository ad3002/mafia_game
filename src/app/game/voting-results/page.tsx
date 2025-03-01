'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameContext } from '@/components/GameProvider';
import { BarChart, Vote, ArrowRight, Users, AlertTriangle, ArrowRightCircle } from 'lucide-react';

export default function VotingResultsPage() {
  const { gameState, updateGameState } = useGameContext();
  const router = useRouter();
  
  const { 
    players = [], 
    votes = {}, 
    round = 0, 
    votingType = 'normal',
    tiedPlayerIds = [],
    confirmationVotes = {}
  } = gameState || {};
  
  // Debug the incoming data
  useEffect(() => {
    console.log('VotingResultsPage: gameState', gameState);
    console.log('VotingResultsPage: votes', votes);
    console.log('VotingResultsPage: players', players);
  }, [gameState, votes, players]);
  
  // Check if we have valid data
  const hasValidData = players.length > 0;
  
  // If we don't have valid data, show a message and return to game
  if (!hasValidData) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-md w-full">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Voting Data</h2>
          <p className="mb-6">Unable to display voting results because no valid voting data was found.</p>
          <button
            onClick={() => router.push('/game')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            Return to Game
            <ArrowRightCircle className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }
  
  // Count votes for each player
  const voteCounts: Record<string, number> = {};
  
  // Count all votes - simple straightforward approach
  Object.values(votes).forEach(votedForId => {
    voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
  });
  
  console.log('VotingResultsPage: voteCounts', voteCounts);
  
  // Find the player who was just eliminated
  let eliminatedId = '';
  let maxVotes = 0;
  
  // First check if any player was already marked as eliminated
  const justEliminatedPlayer = players.find(p => 
    !p.isAlive && voteCounts[p.id] && voteCounts[p.id] > 0
  );
  
  if (justEliminatedPlayer) {
    eliminatedId = justEliminatedPlayer.id;
    maxVotes = voteCounts[eliminatedId] || 0;
  } else {
    // Find player with most votes among all players
    Object.entries(voteCounts).forEach(([playerId, voteCount]) => {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        eliminatedId = playerId;
      }
    });
  }
  
  console.log('VotingResultsPage: eliminatedId', eliminatedId);
  console.log('VotingResultsPage: maxVotes', maxVotes);
  
  // For confirmation voting, count exile/keep votes
  const exileVotes = Object.values(confirmationVotes).filter(v => v).length;
  const keepVotes = Object.values(confirmationVotes).filter(v => !v).length;
  const totalConfirmationVotes = Object.values(confirmationVotes).length;
  const percentageExile = totalConfirmationVotes > 0 
    ? (exileVotes / totalConfirmationVotes) * 100 
    : 0;
  
  const getPlayerNameById = (id: string): string => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };
  
  const continueToNextPhase = () => {
    // For confirmation votes that didn't pass, we don't eliminate anyone
    if (votingType === 'confirmation' && percentageExile <= 50) {
      updateGameState(prev => ({
        ...prev,
        phase: 'night',
        round: prev.round + 1,
        votes: {}, // Only clear votes when moving to next phase
        confirmationVotes: {},
        votingType: 'normal',
        tiedPlayerIds: [],
        showVotingResults: false
      }));
    } else {
      // Normal flow - continue to next phase
      updateGameState(prev => ({
        ...prev,
        phase: 'night',
        round: prev.round + 1,
        votes: {}, // Only clear votes when moving to next phase
        confirmationVotes: {},
        votingType: 'normal',
        tiedPlayerIds: [],
        showVotingResults: false
      }));
    }
    
    // Navigate back to the game
    router.push('/game');
  };
  
  // Get the player who either was eliminated or was the subject of the confirmation vote
  const focusedPlayerId = votingType === 'confirmation' && tiedPlayerIds.length > 0
    ? tiedPlayerIds[0]
    : eliminatedId;
  
  const focusedPlayer = players.find(p => p.id === focusedPlayerId);
  
  // Debug the constructed vote data
  useEffect(() => {
    console.log('VotingResultsPage: Vote distribution data', 
      Object.entries(voteCounts)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
    );
  }, [voteCounts]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {votingType === 'normal' ? 'Voting Results' : 
             votingType === 'runoff' ? 'Runoff Results' : 
             'Confirmation Vote Results'}
          </h2>
          <BarChart className="h-6 w-6 text-purple-600" />
        </div>
        
        {/* Always show vote distribution if there are any votes */}
        {Object.keys(voteCounts).length > 0 && votingType !== 'confirmation' && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Vote className="h-5 w-5 mr-2 text-purple-600" />
              Vote Distribution
            </h3>
            
            <div className="space-y-3">
              {Object.entries(voteCounts)
                // Show only players who received votes
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([playerId, count]) => {
                  const totalVotes = Object.values(votes).length;
                  const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  const isEliminated = playerId === eliminatedId;
                  const player = players.find(p => p.id === playerId);
                  
                  return (
                    <div key={playerId} className="flex items-center">
                      <div className="w-1/4 font-medium truncate pr-2">
                        <span className={isEliminated ? 'text-red-600 font-bold' : ''}>
                          {getPlayerNameById(playerId)}
                        </span>
                        {player && !player.isAlive && <span className="text-xs text-red-500 ml-1">(eliminated)</span>}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isEliminated ? 'bg-red-500' : 'bg-blue-500'} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-16 text-right font-medium">
                        {count} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        
        {votingType === 'confirmation' && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Vote className="h-5 w-5 mr-2 text-purple-600" />
              Confirmation Vote Results
            </h3>
            
            {tiedPlayerIds.length > 0 && (
              <div className="mb-4 text-center">
                <span className="font-medium">
                  Should {getPlayerNameById(tiedPlayerIds[0])} be exiled?
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Exile votes */}
              <div className="flex items-center">
                <div className="w-1/4 font-medium truncate pr-2">Exile</div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${percentageExile}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right font-medium">
                  {exileVotes} ({Math.round(percentageExile)}%)
                </div>
              </div>
              
              {/* Keep votes */}
              <div className="flex items-center">
                <div className="w-1/4 font-medium truncate pr-2">Keep</div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${totalConfirmationVotes > 0 ? 100 - percentageExile : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right font-medium">
                  {keepVotes} ({Math.round(totalConfirmationVotes > 0 ? 100 - percentageExile : 0)}%)
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-gray-100 border border-gray-300">
              <p className="text-center text-sm">
                Exile requires over 50% of votes to pass
              </p>
            </div>
          </div>
        )}
        
        {/* Only show individual votes section if there are votes */}
        {((votingType !== 'confirmation' && Object.keys(votes).length > 0) ||
          (votingType === 'confirmation' && Object.keys(confirmationVotes).length > 0)) && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Individual Votes
            </h3>
            
            {votingType !== 'confirmation' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(votes).map(([voterId, votedForId]) => (
                  <div 
                    key={voterId} 
                    className="flex items-center p-2 bg-gray-50 rounded-md"
                  >
                    <div className="font-medium">{getPlayerNameById(voterId)}</div>
                    <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                    <div 
                      className={`${votedForId === eliminatedId ? 'text-red-600 font-medium' : ''}`}
                    >
                      {getPlayerNameById(votedForId)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(confirmationVotes).map(([voterId, isExile]) => (
                  <div 
                    key={voterId} 
                    className="flex items-center p-2 bg-gray-50 rounded-md"
                  >
                    <div className="font-medium">{getPlayerNameById(voterId)}</div>
                    <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                    <div 
                      className={`${isExile ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}
                    >
                      {isExile ? 'Exile' : 'Keep'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="text-center">
          {votingType === 'normal' && focusedPlayer && !focusedPlayer.isAlive && (
            <div className="mb-4 text-lg">
              <span className="font-bold text-red-600">
                {getPlayerNameById(focusedPlayerId)}
              </span> has been eliminated!
            </div>
          )}
          
          {votingType === 'runoff' && focusedPlayer && !focusedPlayer.isAlive && (
            <div className="mb-4 text-lg">
              <span className="font-bold text-red-600">
                {getPlayerNameById(focusedPlayerId)}
              </span> has been eliminated in the runoff vote!
            </div>
          )}
          
          {votingType === 'confirmation' && (
            <div className="mb-4 text-lg">
              {percentageExile > 50 ? (
                <div>
                  <span className="font-bold text-red-600">
                    {getPlayerNameById(focusedPlayerId)}
                  </span> has been exiled from the town!
                </div>
              ) : (
                <div>
                  <span className="font-bold text-green-600">
                    {getPlayerNameById(focusedPlayerId)}
                  </span> stays in the town! No one was eliminated.
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={continueToNextPhase}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            Continue to Next Round
            <ArrowRightCircle className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}