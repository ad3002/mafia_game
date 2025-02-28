import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameContext } from './GameProvider';
import PlayerCard from './PlayerCard';
import { Vote, Check, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { checkGameEnd, generateId } from '@/utils/helpers';

export default function VotingPhase() {
  const { gameState, updateGameState } = useGameContext();
  const router = useRouter();
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
      phase: 'voting' as const,
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
      phase: 'voting' as const,
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
          phase: 'voting' as const,
          action: `No clear majority. Starting runoff vote between tied players.`,
          timestamp: Date.now(),
        };
        
        const tiedPlayerNames = playersWithMaxVotes
          .map(id => players.find(p => p.id === id)?.name)
          .join(', ');
        
        const tieLogEntry = {
          id: generateId(),
          round: gameState.round,
          phase: 'voting' as const,
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
          phase: 'voting' as const,
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
      phase: 'voting' as const,
      action: `Confirmation vote result: ${exileVotes} out of ${totalVotes} (${Math.round(percentageExile)}%) voted to exile ${targetPlayer?.name}.`,
      timestamp: Date.now(),
    };
    
    if (percentageExile > 50) {
      // More than 50% voted to exile
      const decisionLogEntry = {
        id: generateId(),
        round: gameState.round,
        phase: 'voting' as const,
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
        phase: 'voting' as const,
        action: `Not enough votes to exile ${targetPlayer?.name}. The town continues with no elimination.`,
        timestamp: Date.now(),
      };
      
      // Update game state and then navigate to voting results page
      updateGameState(prev => ({
        ...prev,
        phase: 'voting',
        showVotingResults: true,
        votingType: 'normal',
        tiedPlayerIds: [],
        confirmationVotes: confirmationVotes,
        gameLog: [...prev.gameLog, resultLogEntry, decisionLogEntry]
        // Notice: We're not clearing the votes here anymore
      }));
      
      // Redirect to voting results page
      router.push('/game/voting-results');
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
  
    // Add log entries for voting outcome and game end if applicable
    const eliminatedPlayer = players.find(p => p.id === eliminatedId);
    const voteLogEntry = {
      id: generateId(),
      round: gameState.round,
      phase: 'voting' as const,
      action: `${eliminatedPlayer?.name} was eliminated by town vote with ${voteCount} votes.`,
      timestamp: Date.now(),
    };
  
    let gameEndLogEntry = null;
    if (gameStatus.isGameOver) {
      gameEndLogEntry = {
        id: generateId(),
        round: gameState.round,
        phase: 'voting' as const,
        action: `Game Over! ${gameStatus.winner === 'town' ? 'Town' : 'Mafia'} wins!`,
        timestamp: Date.now(),
      };
    }
  
    updateGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      phase: gameStatus.isGameOver ? 'results' : 'voting',
      showVotingResults: true,
      votingType: 'normal',
      tiedPlayerIds: [],
      gameLog: [...prev.gameLog, voteLogEntry, ...(gameEndLogEntry ? [gameEndLogEntry] : [])]
      // Notice: We're not clearing the votes here anymore
    }));
    
    // Redirect to voting results page
    router.push('/game/voting-results');
  };
  
  if (!currentVoterPlayer) return null;
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">
          {votingType === 'normal' ? 'Town Voting' : 
           votingType === 'runoff' ? 'Runoff Vote' : 
           'Confirmation Vote'}
        </h2>
        
        {votingType === 'normal' && (
          <p className="text-gray-600">Day {gameState.round}: Who do you suspect?</p>
        )}
        
        {votingType === 'runoff' && (
          <p className="text-gray-600">
            Tie vote! Runoff between {tiedPlayerIds.map(id => {
              const player = players.find(p => p.id === id);
              return player?.name;
            }).join(' and ')}.
          </p>
        )}
        
        {votingType === 'confirmation' && tiedPlayerIds.length > 0 && (
          <p className="text-gray-600">
            Vote to exile or keep{' '}
            <span className="font-semibold">
              {players.find(p => p.id === tiedPlayerIds[0])?.name}
            </span>
          </p>
        )}
      </div>
      
      <div className="mb-6">
        <div className="text-center text-lg mb-2">
          <span className="font-bold">{currentVoterPlayer.name}</span>
          {currentVoterPlayer.role !== 'unknown' && (
            <span className="text-xs bg-gray-200 rounded-full px-2 py-1 ml-2">
              {currentVoterPlayer.role}
            </span>
          )}
        </div>
        
        <p className="text-center text-gray-600">
          It's your turn to vote
        </p>
      </div>
      
      {votingType === 'confirmation' ? (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-center">
            Should {players.find(p => p.id === tiedPlayerIds[0])?.name} be exiled?
          </h3>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleConfirmationSelect(true)}
              className={`px-4 py-3 rounded-lg flex-1 flex items-center justify-center gap-2 ${
                confirmationVote === true 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-red-100'
              }`}
            >
              <ThumbsDown className="h-5 w-5" />
              Exile
            </button>
            
            <button
              onClick={() => handleConfirmationSelect(false)}
              className={`px-4 py-3 rounded-lg flex-1 flex items-center justify-center gap-2 ${
                confirmationVote === false 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 hover:bg-green-100'
              }`}
            >
              <ThumbsUp className="h-5 w-5" />
              Keep
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Choose a player to vote for:</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {eligiblePlayers
              .filter(player => player.id !== currentVoterPlayer.id) // Cannot vote for self
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerSelect(player.id)}
                  className={`p-2 border rounded-lg ${
                    selectedPlayer === player.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{player.name}</div>
                  {/* Removing role display for other players during voting */}
                </button>
              ))
            }
          </div>
        </div>
      )}
      
      <div className="text-center">
        <button
          onClick={handleVote}
          disabled={
            (votingType === 'confirmation' && confirmationVote === null) || 
            (votingType !== 'confirmation' && !selectedPlayer)
          }
          className={`px-6 py-2 rounded-lg flex items-center justify-center mx-auto ${
            ((votingType === 'confirmation' && confirmationVote !== null) || 
            (votingType !== 'confirmation' && selectedPlayer)) 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Vote className="h-5 w-5 mr-2" />
          Submit Vote
        </button>
      </div>
    </div>
  );
}