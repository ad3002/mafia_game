import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { VersionDisplay } from '@/components/VersionDisplay'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mafia Game',
  description: 'A multiplayer mafia party game',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <VersionDisplay />
      </body>
    </html>
  )
}