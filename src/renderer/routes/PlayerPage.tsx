import { usePlayerStore } from '../stores/playerStore'
import { usePlayback } from '../hooks/usePlayback'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import { playQueueFromPaths } from '../lib/playbackActions'
import VideoCanvas from '../components/player/VideoCanvas'
import ControlBar from '../components/player/ControlBar'
import SeekBar from '../components/player/SeekBar'
import PlayerPlaylistPanel from '../components/player/PlayerPlaylistPanel'
import FileDropZone from '../components/shared/FileDropZone'

export default function PlayerPage() {
  const playbackState = usePlayerStore((s) => s.playbackState)
  const currentMetadata = usePlayerStore((s) => s.currentMetadata)
  const playQueue = usePlayerStore((s) => s.playQueue)
  const playlistPanelOpen = usePlayerStore((s) => s.playlistPanelOpen)
  const togglePlaylistPanel = usePlayerStore((s) => s.togglePlaylistPanel)
  const { openFile, openUrl } = usePlayback()
  useKeyboardControls()

  const hasMedia = !!playbackState.currentFile
  const showPlaylistToggle = hasMedia || playQueue.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 relative bg-black min-h-0">
            {hasMedia ? (
              <>
                <VideoCanvas />
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none max-w-[min(100%,24rem)] truncate">
                  <span className="text-sm text-white/80">{currentMetadata?.fileName}</span>
                  {currentMetadata?.resolution && (
                    <span className="text-xs text-white/50 ml-2">{currentMetadata.resolution}</span>
                  )}
                </div>
                {showPlaylistToggle && (
                  <button
                    type="button"
                    onClick={() => togglePlaylistPanel()}
                    title={playlistPanelOpen ? '隐藏播放列表' : '显示播放列表'}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/>
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <>
                <FileDropZone
                  onFileOpen={openFile}
                  onPathsDropped={(paths) => {
                    void playQueueFromPaths(paths, 0)
                  }}
                  onUrlOpen={openUrl}
                />
                {playQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => togglePlaylistPanel()}
                    title={playlistPanelOpen ? '隐藏播放列表' : '显示播放列表'}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-lg bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
          {hasMedia && (
            <div className="shrink-0">
              <SeekBar />
              <ControlBar />
            </div>
          )}
        </div>
        {playlistPanelOpen && <PlayerPlaylistPanel />}
      </div>
    </div>
  )
}
