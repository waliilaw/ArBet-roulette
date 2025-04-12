"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "./ui/button"
import { VolumeX, Volume2 } from "lucide-react"

export function useSoundEffects(enabled: boolean = true) {
  // Prepare sound effects
  const [spinSound, setSpinSound] = useState<HTMLAudioElement | null>(null)
  const [winSound, setWinSound] = useState<HTMLAudioElement | null>(null)
  const [loseSound, setLoseSound] = useState<HTMLAudioElement | null>(null)
  const [betSound, setBetSound] = useState<HTMLAudioElement | null>(null)

  // Initialize sound effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Helper function to safely load audio
      const safeLoadAudio = (path: string) => {
        try {
          const audio = new Audio(path)
          audio.addEventListener('error', (e) => {
            console.warn(`Could not load sound file: ${path}`, e)
          })
          return audio
        } catch (err) {
          console.warn(`Error creating audio element for ${path}:`, err)
          return null
        }
      }

      // Create audio elements but don't play them yet
      setSpinSound(safeLoadAudio("/sounds/spin.mp3"))
      setWinSound(safeLoadAudio("/sounds/win.mp3"))
      setLoseSound(safeLoadAudio("/sounds/lose.mp3"))
      setBetSound(safeLoadAudio("/sounds/bet.mp3"))
    }
    
    // Cleanup function
    return () => {
      if (spinSound) spinSound.pause()
      if (winSound) winSound.pause()
      if (loseSound) loseSound.pause()
      if (betSound) betSound.pause()
    }
  }, [])

  // Sound player functions with safe play
  const safePlay = useCallback((sound: HTMLAudioElement | null) => {
    if (sound && enabled) {
      sound.currentTime = 0
      sound.play().catch(err => {
        // Silently fail if browser prevents autoplay
        console.warn("Error playing sound:", err)
      })
    }
  }, [enabled])

  const playSpinSound = useCallback(() => {
    safePlay(spinSound)
  }, [spinSound, safePlay])

  const playWinSound = useCallback(() => {
    safePlay(winSound)
  }, [winSound, safePlay])

  const playLoseSound = useCallback(() => {
    safePlay(loseSound)
  }, [loseSound, safePlay])

  const playBetSound = useCallback(() => {
    safePlay(betSound)
  }, [betSound, safePlay])

  return {
    playSpinSound,
    playWinSound,
    playLoseSound,
    playBetSound
  }
}

interface SoundToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-1 h-auto w-auto bg-gray-800 border-2 border-gray-700 pixel-border"
      onClick={() => onToggle(!enabled)}
      aria-label={enabled ? "Mute sounds" : "Enable sounds"}
    >
      {enabled ? (
        <Volume2 className="h-5 w-5 text-green-400" />
      ) : (
        <VolumeX className="h-5 w-5 text-red-400" />
      )}
    </Button>
  )
} 