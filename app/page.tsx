import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Welcome to Mafia Game</h1>
        <p className="text-xl mb-8">
          A multiplayer party game of deception and deduction
        </p>
        <div className="flex flex-col gap-4">
          <Link 
            href="/game" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition duration-200"
          >
            Start New Game
          </Link>
        </div>
      </div>
    </main>
  )
}