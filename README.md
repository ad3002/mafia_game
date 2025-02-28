# Mafia Game

A web-based multiplayer game of deception and deduction built with Next.js, Tailwind CSS, and TypeScript.

## Game Overview

- 10 Players
- Roles: 6 Civilians, 1 Sheriff, 2 Mafia, 1 Don
- No game master - the system handles everything

## Features

- Complete serverless implementation (no backend required)
- Clean UI with Tailwind CSS and Lucide icons
- Fully automated game flow
- Mobile-responsive design

## Setup and Gameplay

1. Enter the names of 10 players
2. Roles are randomly assigned
3. Game alternates between night and day phases:
   - Night: Mafia selects a player to eliminate, Sheriff investigates
   - Day: The eliminated player is revealed, and discussion follows
   - Voting: Players vote to eliminate a suspected mafia member
4. The game continues until either all mafia are eliminated (town wins) or mafia outnumber town (mafia wins)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to play the game.