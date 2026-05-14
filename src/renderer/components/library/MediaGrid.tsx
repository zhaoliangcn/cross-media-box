import { MediaItem } from '../../types/media'

const formatColors: Record<string, string> = {
  mp4: 'bg-blue-500/20 text-blue-400',
  mkv: 'bg-green-500/20 text-green-400',
  avi: 'bg-yellow-500/20 text-yellow-400',
  mov: 'bg-purple-500/20 text-purple-400',
  wmv: 'bg-orange-500/20 text-orange-400',
  flv: 'bg-pink-500/20 text-pink-400',
  webm: 'bg-teal-500/20 text-teal-400',
  mp3: 'bg-indigo-500/20 text-indigo-400',
  flac: 'bg-cyan-500/20 text-cyan-400',
  wav: 'bg-rose-500/20 text-rose-400'
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '--'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

interface MediaGridProps {
  mediaList: MediaItem[]
  onPlay: (filePath: string) => void
}

export default function MediaGrid({ mediaList, onPlay }: MediaGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
      {mediaList.map((media) => {
        const format = media.format || 'unknown'
        const colorClass = formatColors[format] || 'bg-gray-500/20 text-gray-400'

        return (
          <div
            key={media.id}
            className="bg-surface rounded-xl border border-border hover:border-accent/50 transition-all cursor-pointer overflow-hidden group"
            onDoubleClick={() => onPlay(media.file_path)}
          >
            <div className="aspect-video bg-surface-light flex items-center justify-center relative">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white/80 bg-black/50">
                {format}
              </span>
              {media.duration && (
                <span className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                  {formatDuration(media.duration)}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-text-primary truncate mb-1">{media.file_name}</h3>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                {media.resolution && <span>{media.resolution}</span>}
                <span>{formatSize(media.file_size)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
