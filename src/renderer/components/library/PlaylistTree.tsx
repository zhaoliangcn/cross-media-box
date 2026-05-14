import { useState } from 'react'
import { Playlist } from '../../types/media'

interface PlaylistTreeProps {
  playlists: Playlist[]
  onScan: () => void
  onCreatePlaylist: (name: string) => void
  onDeletePlaylist: (id: number) => void
  isScanning: boolean
}

export default function PlaylistTree({
  playlists,
  onScan,
  onCreatePlaylist,
  onDeletePlaylist,
  isScanning
}: PlaylistTreeProps) {
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleCreate = () => {
    if (newName.trim()) {
      onCreatePlaylist(newName.trim())
      setNewName('')
      setShowInput(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-medium text-text-primary mb-2">媒体库</h2>
        <button
          onClick={onScan}
          disabled={isScanning}
          className="w-full px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isScanning ? '扫描中...' : '扫描目录'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">歌单</span>
          <button
            onClick={() => setShowInput(!showInput)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {showInput && (
          <div className="px-2 mb-2 flex gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="歌单名称"
              className="flex-1 bg-surface-dark text-text-primary text-xs rounded-lg px-2.5 py-1.5 border border-border outline-none focus:border-accent"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-2.5 py-1.5 bg-accent text-white text-xs rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
            >
              确定
            </button>
          </div>
        )}

        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-hover cursor-pointer group transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <span className="text-sm text-text-secondary truncate flex-1">{playlist.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeletePlaylist(playlist.id)
              }}
              className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-surface-light text-text-muted hover:text-danger transition-all cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
