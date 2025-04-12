"use client"

import dynamic from 'next/dynamic'

// Dynamically import the RouletteGame component with SSR disabled
const RouletteGame = dynamic(() => import('@/components/roulette-game'), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-screen">Loading game...</div>
})

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-slate-950">
      <RouletteGame />
    </main>
  )
} 