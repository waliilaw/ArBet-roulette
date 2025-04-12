'use client'
import RouletteGame from "../components/roulette-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <h1 className="text-3xl md:text-4xl font-pixel text-yellow-400 mb-8 text-center">PIXELATED ROULETTE</h1>
      <RouletteGame />
    </main>
  )
} 