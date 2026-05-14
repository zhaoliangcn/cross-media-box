import { useLibraryStore } from '../stores/libraryStore'
import { useMediaLibrary } from '../hooks/useMediaLibrary'
import MediaGrid from '../components/library/MediaGrid'
import PlaylistTree from '../components/library/PlaylistTree'
import SearchBar from '../components/library/SearchBar'

export default function LibraryPage() {
  const mediaList = useLibraryStore((s) => s.mediaList)
  const playlists = useLibraryStore((s) => s.playlists)
  const isScanning = useLibraryStore((s) => s.isScanning)
  const scanProgress = useLibraryStore((s) => s.scanProgress)
  const filter = useLibraryStore((s) => s.filter)
  const setFilter = useLibraryStore((s) => s.setFilter)
  const { scan, refresh, playMedia, createPlaylist, deletePlaylist } = useMediaLibrary()

  const filteredMedia = mediaList.filter((m) => {
    if (filter.format && m.format !== filter.format) return false
    if (filter.search) {
      const search = filter.search.toLowerCase()
      return m.file_name.toLowerCase().includes(search)
    }
    return true
  })

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-border bg-surface flex flex-col shrink-0">
        <PlaylistTree
          playlists={playlists}
          onScan={scan}
          onCreatePlaylist={createPlaylist}
          onDeletePlaylist={deletePlaylist}
          isScanning={isScanning}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <SearchBar
              value={filter.search || ''}
              onChange={(search) => setFilter({ ...filter, search: search || undefined })}
            />
            <button
              onClick={refresh}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
            >
              刷新
            </button>
          </div>
          {isScanning && scanProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary">
                  正在扫描媒体文件... {scanProgress.current}/{scanProgress.total}
                </span>
              </div>
              <div className="w-full h-1 bg-surface-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-sm">{isScanning ? '扫描中...' : '媒体库为空，请先扫描文件目录'}</p>
            </div>
          ) : (
            <MediaGrid
              mediaList={filteredMedia}
              onPlay={(filePath) =>
                playMedia(
                  filePath,
                  filteredMedia.map((m) => m.file_path)
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
