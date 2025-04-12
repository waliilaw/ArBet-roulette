'use client'
import RouletteGame from "@/components/roulette-game"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4" style={{
      background: "#0e0b1a",
      backgroundImage: `
        linear-gradient(45deg, rgba(30,20,60,0.15) 25%, transparent 25%, transparent 75%, rgba(30,20,60,0.15) 75%),
        linear-gradient(45deg, rgba(30,20,60,0.15) 25%, transparent 25%, transparent 75%, rgba(30,20,60,0.15) 75%)
      `,
      backgroundSize: "60px 60px",
      backgroundPosition: "0 0, 30px 30px",
      position: "relative",
      overflow: "hidden",
    }}>
      <h1 className="text-4xl font-bold text-white mb-8 font-pixel" style={{
        textShadow: "3px 3px 0 #000",
        letterSpacing: "2px",
        color: "#fef3c7",
      }}>PIXELATED ROULETTE</h1>
      
      <RouletteGame />
    </main>
  )
} 