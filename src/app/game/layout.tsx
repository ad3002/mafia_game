'use client';

import React from 'react';
import { GameProvider } from '@/components/GameProvider';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameProvider>
      {children}
    </GameProvider>
  );
}