import React, { useState } from 'react';
import { Shield, Gavel, Gun, Crown, User, EyeOff, Eye } from 'lucide-react';
import { Player, PlayerRole } from '@/types/game';

interface RoleRevealProps {
  player: Player;
  onContinue: () => void;
}

export default function RoleReveal({ player, onContinue }: RoleRevealProps) {
  const [revealed, setRevealed] = useState(false);
  
  const handleReveal = () => {
    setRevealed(true);
  };
  
  const getRoleInfo = (role: PlayerRole) => {
    switch (role) {
      case 'civilian':
        return {
          icon: <User className="h-16 w-16 text-green-600" />,
          name: 'Civilian',
          description: 'You are a regular citizen. Work with other town members to identify and eliminate the Mafia.',
          color: 'bg-green-100 border-green-200 text-green-800'
        };
      case 'sheriff':
        return {
          icon: <Shield className="h-16 w-16 text-blue-600" />,
          name: 'Sheriff',
          description: 'You can investigate one player each night to determine if they are Mafia or not.',
          color: 'bg-blue-100 border-blue-200 text-blue-800'
        };
      case 'mafia':
        return {
          icon: <Gun className="h-16 w-16 text-red-600" />,
          name: 'Mafia',
          description: 'Work with other Mafia members to eliminate the town. Each night, you can eliminate one player.',
          color: 'bg-red-100 border-red-200 text-red-800'
        };
      case 'don':
        return {
          icon: <Crown className="h-16 w-16 text-red-800" />,
          name: 'Don',
          description: 'You are the leader of the Mafia. Work with your team to eliminate the town.',
          color: 'bg-red-100 border-red-200 text-red-800'
        };
    }
  };
  
  const roleInfo = getRoleInfo(player.role);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <p className="text-gray-600">Tap to reveal your role</p>
        </div>
        
        {!revealed ? (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={handleReveal}
          >
            <EyeOff className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">Tap to reveal your role</p>
          </div>
        ) : (
          <div className={`border-2 rounded-lg p-6 ${roleInfo.color}`}>
            <div className="flex flex-col items-center mb-4">
              {roleInfo.icon}
              <h3 className="text-xl font-bold mt-2">{roleInfo.name}</h3>
            </div>
            <p className="text-center mb-4">{roleInfo.description}</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={onContinue}
            className={`px-6 py-2 rounded-lg text-white ${
              revealed 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!revealed}
          >
            {revealed ? 'Continue' : 'Reveal First'}
          </button>
        </div>
      </div>
    </div>
  );
}