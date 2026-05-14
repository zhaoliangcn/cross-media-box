import { useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { usePlayback } from './usePlayback'

export function useKeyboardControls() {
  const { control } = usePlayback()
  const playbackState = usePlayerStore((s) => s.playbackState)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playbackState.currentFile) return

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return
      }

      const { currentTime, duration } = playbackState
      if (duration <= 0) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          control('seek', Math.max(0, currentTime - 10))
          break
        case 'ArrowRight':
          e.preventDefault()
          control('seek', Math.min(duration, currentTime + 10))
          break
        case 'ArrowUp':
          e.preventDefault()
          control('volume', Math.min(1, playbackState.volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          control('volume', Math.max(0, playbackState.volume - 0.1))
          break
        case ' ':
          e.preventDefault()
          control(playbackState.playing ? 'pause' : 'play')
          break
        case 'Home':
          e.preventDefault()
          control('seek', 0)
          break
        case 'End':
          e.preventDefault()
          control('seek', duration)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [control, playbackState, playbackState.currentFile])
}
