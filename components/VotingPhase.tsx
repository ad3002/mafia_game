import React, { useState } from 'react';
import { useGameContext } from './GameProvider';
import PlayerCard from './PlayerCard';
import { Vote, Check, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { checkGameEnd, generateId } from '@/utils/helpers';

export default function VotingPhase() {
  const { gameState, updateGameState } = useGameContext();
  const { 
    players, 
    votes, 
    votingType = 'normal', 
    tiedPlayerIds = [],
  } = gameState;
  
  const [currentVoter, setCurrentVoter] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [confirmationVote, setConfirmationVote] = useState<boolean | null>(null);
  
  const alivePlayers = players.filter(p => p.isAlive);
  const currentVoterPlayer = alivePlayers[currentVoter];
  
  // For runoff voting, we only show tied players
  const eligiblePlayers = votingType === 'runoff' 
    ? alivePlayers.filter(p => tiedPlayerIds.includes(p.id))
    : alivePlayers;
  
  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId);
  };
  
  const handleConfirmationSelect = (exile: boolean) => {
    setConfirmationVote(exile);
  };
  
  const handleVote = () => {
    if (!currentVoterPlayer) return;
    
    if (votingType === 'confirmation') {
      if (confirmationVote === null) return;
      handleConfirmationVote();
    } else {
      if (!selectedPlayer) return;
      handleNormalOrRunoffVote();
    }
  };
  
  const handleNormalOrRunoffVote = () => {
    if (!selectedPlayer || !currentVoterPlayer) return;
    
    // Create log entry for the vote
    const votedForPlayer = players.find(p => p.id === selectedPlayer);
    const logEntry = {
      id: generateId(),
      round: gameState.round,
      phase: 'voting',
      action: `${currentVoterPlayer.name} voted for ${votedForPlayer?.name}.`,
      timestamp: Date.now(),
    };
    
    // Create the updated votes object including the current vote
    const updatedVotes = {
      ...votes,
      [currentVoterPlayer.id]: selectedPlayer
    };
    
    // Record vote
    updateGameState(prev => ({
      ...prev,
      votes: updatedVotes,
      gameLog: [...prev.gameLog, logEntry]
    }));
    
    // Move to next voter or process results
    if (currentVoter < alivePlayers.length - 1) {
      setCurrentVoter(currentVoter + 1);
      setSelectedPlayer(null);
    } else {
      processVotingResults(updatedVotes);
    }
  };
  
  const handleConfirmationVote = () => {
    if (confirmationVote === null || !currentVoterPlayer) return;
    
    // Create log entry for the vote
    const targetPlayer = players.find(p => p.id === tiedPlayerIds[0]);
    const logEntry = {
      id: generateId(),
      round: gameState.round,
      phase: 'voting',
      action: `${currentVoterPlayer.name} voted to ${confirmationVote ? 'exile' : 'keep'} ${targetPlayer?.name}.`,
      timestamp: Date.now(),
    };
    
    // Create the updated confirmation votes object
    const updatedConfirmationVotes = {
      ...(gameState.confirmationVotes || {}),
      [currentVoterPlayer.id]: confirmationVote
    };
    
    // Record vote
    updateGameState(prev => ({
      ...prev,
      confirmationVotes: updatedConfirmationVotes,
      gameLog: [...prev.gameLog, logEntry]
    }));
    
    // Move to next voter or process results
    if (currentVoter < alivePlayers.length - 1) {
      setCurrentVoter(currentVoter + 1);
      setConfirmationVote(null);
    } else {
      processConfirmationResults(updatedConfirmationVotes);
    }
  };
  
  const processVotingResults = (updatedVotes: Record<string, string>) => {
    // Count votes for each player
    const voteCounts: Record<string, number> = {};
    
    // Count all votes
    Object.values(updatedVotes).forEach(votedId => {
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });
    
    console.log('Vote counts:', voteCounts);
    
    // Find the maximum vote count
    let maxVotes = 0;
    Object.values(voteCounts).forEach(count => {
      if (count > maxVotes) maxVotes = count;
    });
    
    // Find players with the maximum votes
    const playersWithMaxVotes = Object.entries(voteCounts)
      .filter(([, count]) => count === maxVotes)
      .map(([id]) => id);
    
    console.log('Players with max votes:', playersWithMaxVotes);
    
    if (playersWithMaxVotes.length > 1) {
      // We have a tie!
      if (votingType === 'normal') {
        // Start a runoff vote
        const logEntry = {
          id: generateId(),
          round: gameState.round,
          phase: 'voting',
          action: `No clear majority. Starting runoff vote between tied players.`,
          timestamp: Date.now(),
        };
        
        const tiedPlayerNames = playersWithMaxVotes
          .map(id => players.find(p => p.id === id)?.name)
          .join(', ');
        
        const tieLogEntry = {
          id: generateId(),
          round: gameState.round,
          phase: 'voting',
          action: `Tied players with ${maxVotes} votes each: ${tiedPlayerNames}`,
          timestamp: Date.now(),
        };
        
        updateGameState(prev => ({
          ...prev,
          votingType: 'runoff',
          tiedPlayerIds: playersWithMaxVotes,
          votes: {}, // Reset votes for runoff
          gameLog: [...prev.gameLog, logEntry, tieLogEntry]
        }));
        
        // Reset the voting state for runoff
        setCurrentVoter(0);
        setSelectedPlayer(null);
        
      } else if (votingType === 'runoff') {
        // Still tied after runoff, start confirmation vote for first tied player
        const logEntry = {
          id: generateId(),
          round: gameState.round,
          phase: 'voting',
          action: `Still tied after runoff. Starting confirmation vote (exile or keep).`,
          timestamp: Date.now(),
        };
        
        updateGameState(prev => ({
          ...prev,
          votingType: 'confirmation',
          tiedPlayerIds: [playersWithMaxVotes[0]], // Take first player for confirmation vote
          confirmationVotes: {}, // Reset confirmation votes
          votes: updatedVotes, // Keep runoff votes for display
          gameLog: [...prev.gameLog, logEntry]
        }));
        
        // Reset the voting state for confirmation
        setCurrentVoter(0);
        setConfirmationVote(null);
      }
    } else {
      // We have a clear winner/loser
      const eliminatedId = playersWithMaxVotes[0];
      
      // Safety check: ensure eliminatedId is valid
      if (!eliminatedId || maxVotes === 0) {
        console.warn('No valid votes found, this should never happen');
        return;
      }
      
      eliminatePlayerAndContinue(eliminatedId, maxVotes);
    }
  };
  
  const processConfirmationResults = (confirmationVotes: Record<string, boolean>) => {
    const exileVotes = Object.values(confirmationVotes).filter(v => v).length;
    const totalVotes = Object.values(confirmationVotes).length;
    const percentageExile = (exileVotes / totalVotes) * 100;
    
    const targetPlayerId = tiedPlayerIds[0];
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    
    // Log the confirmation vote results
    const resultLogEntry = {
      id: generateId(),
      round: gameState.round,
      phase: 'voting',
      action: `Confirmation vote result: ${exileVotes} out of ${totalVotes} (${Math.round(percentageExile)}%) voted to exile ${targetPlayer?.name}.`,
      timestamp: Date.now(),
    };
    
    if (percentageExile > 50) {
      // More than 50% voted to exile
      const decisionLogEntry = {
        id: generateId(),
        round: gameState.round,
        phase: 'voting',
        action: `The town has decided to exile ${targetPlayer?.name}.`,
        timestamp: Date.now(),
      };
      
      updateGameState(prev => ({
        ...prev,
        gameLog: [...prev.gameLog, resultLogEntry, decisionLogEntry]
      }));
      
      eliminatePlayerAndContinue(targetPlayerId, exileVotes);
      
    } else {
      // Not enough votes to exile
      const decisionLogEntry = {
        id: generateId(),
        round: gameState.round,
        phase: 'voting',
        action: `Not enough votes to exile ${targetPlayer?.name}. The town continues with no elimination.`,
        timestamp: Date.now(),
      };
      
      updateGameState(prev => ({
        ...prev,
        showVotingResults: true,
        votingType: 'normal',
        tiedPlayerIds: [],
        confirmationVotes: confirmationVotes,
        gameLog: [...prev.gameLog, resultLogEntry, decisionLogEntry]
      }));
    }
  };
  
  const eliminatePlayerAndContinue = (eliminatedId: string, voteCount: number) => {
    // Eliminate player
    const updatedPlayers = players.map(player => {
      if (player.id === eliminatedId) {
        return { ...player, isAlive: false };
      }
      return player;
    });
    
    // Check if game is over
    const gameStatus = checkGameEnd({
      ...gameState,
      players: updatedPlayers
    });
    
    // Add log entry for the completed vote
    const eliminatedPlayer = players.find(p => p.id === eliminatedId);
    const logEntry = {
      id: generateId(),
      round: gameState.round,
      phase: 'voting',
      action: `Voting complete. ${eliminatedPlayer?.name} received ${voteCount} votes and was eliminated.`,
      timestamp: Date.now(),
    };
    
    if (gameStatus.isGameOver) {
      // Game over
      updateGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        phase: 'results',
        showVotingResults: true,
        gameLog: [...prev.gameLog, logEntry]
      }));
    } else {
      // Show voting results before next round
      updateGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        showVotingResults: true,
        votingType: 'normal', // Reset voting type for next round
        tiedPlayerIds: [],
        gameLog: [...prev.gameLog, logEntry]
      }));
    }
  };
  
  if (!currentVoterPlayer) return null;
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="text-center mb-6">
        <Vote className="h-8 w-8 mx-auto mb-2 text-purple-600" />
        <h2 className="text-2xl font-bold">
          {votingType === 'normal' ? 'Voting Phase' : 
           votingType === 'runoff' ? 'Runoff Voting' : 
           'Confirmation Vote'}
        </h2>
        <p className="text-gray-600">
          {currentVoterPlayer.name}'s turn to vote
        </p>
        
        {votingType === 'runoff' && (
          <p className="mt-2 text-sm text-purple-600">
            Vote between tied players only
          </p>
        )}
        
        {votingType === 'confirmation' && tiedPlayerIds.length > 0 && (
          <p className="mt-2 text-sm text-purple-600">
            Should {players.find(p => p.id === tiedPlayerIds[0])?.name} be exiled? (Requires majority)
          </p>
        )}
      </div>
      
      {(votingType === 'normal' || votingType === 'runoff') && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Choose a player to eliminate:</h3>
          
          {/* Self-voting notice */}
          {selectedPlayer === currentVoterPlayer.id && (
            <div className="p-3 mb-4 bg-yellow-100 text-yellow-800 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>You're voting for yourself! This might draw suspicion or be a strategic move.</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {eligiblePlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayer === player.id}
                onClick={() => handlePlayerSelect(player.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {votingType === 'confirmation' && (
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Vote to exile or keep:</h3>
          
          {tiedPlayerIds.length > 0 && (
            <div className="flex flex-col items-center mb-6">
              <PlayerCard
                player={players.find(p => p.id === tiedPlayerIds[0])!}
                isSelected={false}
                onClick={() => {}}
              />
            </div>
          )}
          
          <div className="flex justify-center gap-4 mt-4">
            <button 
              onClick={() => handleConfirmationSelect(true)}
              className={`px-6 py-3 rounded-lg flex items-center justify-center
                ${confirmationVote === true 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              Exile
            </button>
            
            <button 
              onClick={() => handleConfirmationSelect(false)}
              className={`px-6 py-3 rounded-lg flex items-center justify-center
                ${confirmationVote === false 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              Keep
            </button>
          </div>
        </div>
      )}
      
      <div className="text-center">
        <button
          onClick={handleVote}
          disabled={(votingType !== 'confirmation' && !selectedPlayer) || 
                   (votingType === 'confirmation' && confirmationVote === null)}
          className={`
            px-6 py-2 rounded-lg text-white flex items-center justify-center mx-auto
            ${((votingType !== 'confirmation' && !selectedPlayer) || 
               (votingType === 'confirmation' && confirmationVote === null))
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'}
          `}
        >
          <Check className="h-5 w-5 mr-1" />
          Confirm Vote
        </button>
      </div>
    </div>
  );
}