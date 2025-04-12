"use client"

import { useState, useEffect, useCallback } from "react"

// Custom hook for managing sound effects
export function useSoundEffects(enabled: boolean = true) {
  // Prepare sound effects
  const [spinSound, setSpinSound] = useState<HTMLAudioElement | null>(null)
  const [winSound, setWinSound] = useState<HTMLAudioElement | null>(null)
  const [loseSound, setLoseSound] = useState<HTMLAudioElement | null>(null)
  const [betSound, setBetSound] = useState<HTMLAudioElement | null>(null)

  // Initialize sound effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create audio elements but don't play them yet
      setSpinSound(new Audio("/sounds/spin.mp3"))
      setWinSound(new Audio("/sounds/win.mp3"))
      setLoseSound(new Audio("/sounds/lose.mp3"))
      setBetSound(new Audio("/sounds/bet.mp3"))
    }
    
    // Cleanup function
    return () => {
      if (spinSound) spinSound.pause()
      if (winSound) winSound.pause()
      if (loseSound) loseSound.pause()
      if (betSound) betSound.pause()
    }
  }, [])

  // Sound player functions
  const playSpinSound = useCallback(() => {
    if (spinSound && enabled) {
      spinSound.currentTime = 0
      spinSound.play().catch(err => console.error("Error playing spin sound:", err))
    }
  }, [spinSound, enabled])

  const playWinSound = useCallback(() => {
    if (winSound && enabled) {
      winSound.currentTime = 0
      winSound.play().catch(err => console.error("Error playing win sound:", err))
    }
  }, [winSound, enabled])

  const playLoseSound = useCallback(() => {
    if (loseSound && enabled) {
      loseSound.currentTime = 0
      loseSound.play().catch(err => console.error("Error playing lose sound:", err))
    }
  }, [loseSound, enabled])

  const playBetSound = useCallback(() => {
    if (betSound && enabled) {
      betSound.currentTime = 0
      betSound.play().catch(err => console.error("Error playing bet sound:", err))
    }
  }, [betSound, enabled])

  return {
    playSpinSound,
    playWinSound,
    playLoseSound,
    playBetSound
  }
}

// Sound toggle button component
interface SoundToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      className="p-1 h-auto w-auto bg-gray-800 border-2 border-gray-700 pixel-border"
      onClick={() => onToggle(!enabled)}
      aria-label={enabled ? "Mute sounds" : "Enable sounds"}
    >
      {enabled ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-5 w-5 text-green-400"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-5 w-5 text-red-400"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  )
} 