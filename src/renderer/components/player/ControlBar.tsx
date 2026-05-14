import { usePlayerStore } from '../../stores/playerStore'
import { usePlayback } from '../../hooks/usePlayback'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ControlBar() {
  const playbackState = usePlayerStore((s) => s.playbackState)
  const playQueue = usePlayerStore((s) => s.playQueue)
  const currentQueueIndex = usePlayerStore((s) => s.currentQueueIndex)
  const { control, stop, playPrevious, playNext } = usePlayback()

  const { playing, currentTime, duration, volume, muted, speed } = playbackState
  const canPrev = playQueue.length > 0 && currentQueueIndex > 0
  const canNext =
    playQueue.length > 0 && currentQueueIndex >= 0 && currentQueueIndex < playQueue.length - 1
  const canSeek = duration > 0

  const handleRewind10 = () => {
    if (!canSeek) return
    control('seek', Math.max(0, currentTime - 10))
  }

  const handleRewind30 = () => {
    if (!canSeek) return
    control('seek', Math.max(0, currentTime - 30))
  }

  const handleForward10 = () => {
    if (!canSeek) return
    control('seek', Math.min(duration, currentTime + 10))
  }

  const handleForward30 = () => {
    if (!canSeek) return
    control('seek', Math.min(duration, currentTime + 30))
  }

  return (
    <div className="h-14 bg-surface border-t border-border px-4 flex items-center gap-3">
      <button
        type="button"
        title="上一首"
        disabled={!canPrev}
        onClick={() => playPrevious()}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
        </svg>
      </button>

      <button
        onClick={handleRewind10}
        disabled={!canSeek}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
        title="快退10秒"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18h2v-6h-2v6zm1-15C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 8h2V6h-2v2z"/>
        </svg>
      </button>

      <button
        onClick={handleRewind30}
        disabled={!canSeek}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
        title="快退30秒"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18h2v-6h-2v6zm1-15C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 8h2V6h-2v2z"/>
        </svg>
      </button>

      <button
        onClick={() => control(playing ? 'pause' : 'play')}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-white transition-colors"
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      <button
        onClick={stop}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-colors"
        title="停止"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h12v12H6z"/>
        </svg>
      </button>

      <button
        onClick={handleForward10}
        disabled={!canSeek}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
        title="快进10秒"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 18h2v-6h-2v6zm-1-15C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM13 8h2V6h-2v2z"/>
        </svg>
      </button>

      <button
        onClick={handleForward30}
        disabled={!canSeek}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
        title="快进30秒"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 18h2v-6h-2v6zm-1-15C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM13 8h2V6h-2v2z"/>
        </svg>
      </button>

      <button
        type="button"
        title="下一首"
        disabled={!canNext}
        onClick={() => playNext()}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>

      <div className="flex items-center gap-2 ml-2 text-xs text-text-secondary font-mono min-w-[100px]">
        <span className="text-text-primary">{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <select
          value={speed}
          onChange={(e) => control('speed', parseFloat(e.target.value))}
          className="bg-surface-light text-text-primary text-xs rounded px-2 py-1 border border-border outline-none focus:border-accent cursor-pointer"
        >
          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((s) => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 min-w-[120px]">
        <button
          onClick={() => control('mute')}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
        >
          {muted || volume === 0 ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : volume}
          onChange={(e) => control('volume', parseFloat(e.target.value))}
          className="w-20 h-1 accent-accent cursor-pointer"
        />
      </div>
    </div>
  )
}
