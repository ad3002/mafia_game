import { Player, PlayerRole, GameState, LogEntry } from '@/types/game';

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Default player names
export const defaultNames = [
  "Alex", "Sam", "Jordan", "Taylor", "Riley", 
  "Morgan", "Casey", "Jamie", "Quinn", "Avery",
  "Emma", "Liam", "Olivia", "Noah", "Sophia", 
  "Jackson", "Ava", "Lucas", "Isabella", "Ethan",
  "Mia", "Mason", "Charlotte", "Aiden", "Amelia",
  "Michael", "Elena", "Daniel", "Sofia", "Nathan"
];

// Get random default names
export function getRandomDefaultNames(count: number): string[] {
  const shuffled = shuffleArray([...defaultNames]);
  return shuffled.slice(0, count);
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Assign roles to players
export function assignRoles(playerNames: string[]): Player[] {
  if (playerNames.length !== 10) {
    throw new Error('Game requires exactly 10 players');
  }

  // Define roles
  const roles: PlayerRole[] = [
    'sheriff',
    'don',
    'mafia',
    'mafia',
    'civilian',
    'civilian',
    'civilian',
    'civilian',
    'civilian',
    'civilian',
  ];

  // Shuffle roles
  const shuffledRoles = shuffleArray(roles);

  // Assign to players
  return playerNames.map((name, index) => ({
    id: generateId(),
    name,
    role: shuffledRoles[index],
    isAlive: true,
  }));
}

// Check if the game has ended
export function checkGameEnd(gameState: GameState): {
  isGameOver: boolean;
  winner?: 'mafia' | 'town';
} {
  const { players } = gameState;
  
  // Count alive players for each team
  const aliveMafia = players.filter(p => (p.role === 'mafia' || p.role === 'don') && p.isAlive).length;
  const aliveTown = players.filter(p => (p.role === 'civilian' || p.role === 'sheriff') && p.isAlive).length;

  // Mafia wins if they equal or outnumber the town
  if (aliveMafia >= aliveTown) {
    return {
      isGameOver: true,
      winner: 'mafia'
    };
  }

  // Town wins if all mafia are dead
  if (aliveMafia === 0) {
    return {
      isGameOver: true,
      winner: 'town'
    };
  }

  // Game continues
  return {
    isGameOver: false
  };
}