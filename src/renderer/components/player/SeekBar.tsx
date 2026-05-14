import { useState, useRef, useCallback, useEffect } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { usePlayback } from '../../hooks/usePlayback'

export default function SeekBar() {
  const playbackState = usePlayerStore((s) => s.playbackState)
  const { control } = usePlayback()
  const seekBarRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverProgress, setHoverProgress] = useState<number | null>(null)

  const { currentTime, duration } = playbackState
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const canSeek = duration > 0

  const getSeekTime = useCallback((clientX: number): number => {
    if (!seekBarRef.current) return 0
    const rect = seekBarRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return ratio * duration
  }, [duration])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canSeek) return
    e.preventDefault()
    setIsDragging(true)
    const seekTime = getSeekTime(e.clientX)
    control('seek', seekTime)
  }, [control, getSeekTime, canSeek])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current) return
    const rect = seekBarRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverProgress(ratio * 100)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverProgress(null)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!seekBarRef.current) return
      const rect = seekBarRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      control('seek', ratio * duration)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, control, duration])

  const displayProgress = isDragging ? (hoverProgress ?? progress) : progress
  const hoverDisplay = hoverProgress !== null ? hoverProgress : displayProgress

  return (
    <div
      ref={seekBarRef}
      className={`h-5 flex items-center group relative ${canSeek ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full h-1 bg-surface-light rounded-full overflow-hidden mx-2 group-hover:h-1.5 transition-all relative">
        <div
          className="h-full bg-white/20 rounded-full absolute top-0 left-0 transition-all duration-100"
          style={{ width: `${hoverDisplay}%` }}
        />
        <div
          className="h-full bg-accent rounded-full relative z-10 transition-all duration-100"
          style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"
          style={{ left: `calc(${Math.min(100, Math.max(0, displayProgress))}% - 6px)` }}
        />
      </div>
    </div>
  )
}
