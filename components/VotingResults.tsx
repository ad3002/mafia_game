import React from 'react';
import { useGameContext } from './GameProvider';
import { BarChart, Vote, ArrowRight, Users, AlertTriangle } from 'lucide-react';
import { generateId } from '@/utils/helpers';

export default function VotingResults() {
  const { gameState, updateGameState } = useGameContext();
  const { 
    players, 
    votes, 
    round, 
    votingType = 'normal',
    tiedPlayerIds = [],
    confirmationVotes = {}
  } = gameState;
  
  console.log('VotingResults: All votes:', votes);
  
  // Count votes for each player
  const voteCounts: Record<string, number> = {};
  
  // Count all votes - simple straightforward approach
  Object.values(votes).forEach(votedForId => {
    voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
  });
  
  console.log('VotingResults: Vote counts:', voteCounts);
  
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
    // Find player with most votes among alive players
    players.forEach(player => {
      if (player.isAlive && voteCounts[player.id] > maxVotes) {
        maxVotes = voteCounts[player.id];
        eliminatedId = player.id;
      }
    });
  }
  
  // For confirmation voting, count exile/keep votes
  const exileVotes = Object.values(confirmationVotes).filter(v => v).length;
  const keepVotes = Object.values(confirmationVotes).filter(v => !v).length;
  const totalConfirmationVotes = Object.values(confirmationVotes).length;
  const percentageExile = totalConfirmationVotes > 0 
    ? (exileVotes / totalConfirmationVotes) * 100 
    : 0;
  
  console.log('VotingResults: Eliminated ID:', eliminatedId);
  
  const getPlayerNameById = (id: string): string => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };
  
  const continueToNextPhase = () => {
    // For confirmation votes that didn't pass, we don't eliminate anyone
    if (votingType === 'confirmation' && percentageExile <= 50) {
      updateGameState(prev => ({
        ...prev,
        showVotingResults: false,
        phase: 'night',
        round: prev.round + 1,
        votes: {},
        confirmationVotes: {},
        votingType: 'normal',
        tiedPlayerIds: []
      }));
      return;
    }
    
    // Normal flow - player was already eliminated
    updateGameState(prev => ({
      ...prev,
      showVotingResults: false,
      phase: 'night',
      round: prev.round + 1,
      votes: {},
      confirmationVotes: {},
      votingType: 'normal',
      tiedPlayerIds: []
    }));
  };
  
  // Get the player who either was eliminated or was the subject of the confirmation vote
  const focusedPlayerId = votingType === 'confirmation' && tiedPlayerIds.length > 0
    ? tiedPlayerIds[0]
    : eliminatedId;
  
  const focusedPlayer = players.find(p => p.id === focusedPlayerId);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {votingType === 'normal' ? 'Voting Results' : 
             votingType === 'runoff' ? 'Runoff Results' : 
             'Confirmation Vote Results'}
          </h2>
          <BarChart className="h-6 w-6 text-purple-600" />
        </div>
        
        {votingType !== 'confirmation' && (
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
                        {!player?.isAlive && <span className="text-xs text-red-500 ml-1">(eliminated)</span>}
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
        
        {votingType !== 'confirmation' && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Individual Votes
            </h3>
            
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
          </div>
        )}
        
        {votingType === 'confirmation' && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Individual Votes
            </h3>
            
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
          </div>
        )}
        
        <div className="text-center">
          {votingType === 'normal' && focusedPlayer && !focusedPlayer.isAlive && (
            <div className="mb-4">
              <span className="font-bold text-red-600">
                {getPlayerNameById(focusedPlayerId)}
              </span> has been eliminated!
            </div>
          )}
          
          {votingType === 'runoff' && focusedPlayer && !focusedPlayer.isAlive && (
            <div className="mb-4">
              <span className="font-bold text-red-600">
                {getPlayerNameById(focusedPlayerId)}
              </span> has been eliminated in the runoff vote!
            </div>
          )}
          
          {votingType === 'confirmation' && (
            <div className="mb-4">
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to Next Round
          </button>
        </div>
      </div>
    </div>
  );
}