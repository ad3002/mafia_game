import React from 'react';
import { Player } from '@/types/game';
import { Shield, Gavel, Gun, Crown, User } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  showRole?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function PlayerCard({ 
  player, 
  showRole = false, 
  isSelected = false,
  onClick
}: PlayerCardProps) {
  const { name, role, isAlive } = player;
  
  const getRoleIcon = () => {
    switch (role) {
      case 'sheriff':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'don':
        return <Crown className="h-5 w-5 text-red-800" />;
      case 'mafia':
        return <Gun className="h-5 w-5 text-red-600" />;
      case 'civilian':
        return <User className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={`
        border rounded-md p-3 
        ${!isAlive ? 'opacity-50 bg-gray-100' : 'bg-white'} 
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      `}
      onClick={isAlive ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{name}</div>
        {!isAlive && <span className="text-red-500 text-sm">Dead</span>}
      </div>
      
      {showRole && (
        <div className="flex items-center mt-2 text-sm text-gray-600">
          {getRoleIcon()}
          <span className="ml-1 capitalize">{role}</span>
        </div>
      )}
    </div>
  );
}