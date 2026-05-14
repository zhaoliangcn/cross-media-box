import { useState, useEffect, useCallback, useRef } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { usePlayback } from '../../hooks/usePlayback'
import { removeQueueItemAt } from '../../lib/playbackActions'

function basename(fullPath: string): string {
  const parts = fullPath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || fullPath
}

type ContextMenuState =
  | { kind: 'row'; index: number; x: number; y: number }
  | { kind: 'panel'; x: number; y: number }

const MENU_W = 200
const MENU_H = 160

function clampMenuPosition(x: number, y: number): { x: number; y: number } {
  const pad = 8
  return {
    x: Math.min(x, window.innerWidth - MENU_W - pad),
    y: Math.min(y, window.innerHeight - MENU_H - pad)
  }
}

export default function PlayerPlaylistPanel() {
  const playQueue = usePlayerStore((s) => s.playQueue)
  const currentQueueIndex = usePlayerStore((s) => s.currentQueueIndex)
  const currentFile = usePlayerStore((s) => s.playbackState.currentFile)
  const { playQueueItemAt, clearQueue, pickFilesAndAppendToQueue } = usePlayback()

  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setMenu(null), [])

  useEffect(() => {
    if (!menu) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const node = menuRef.current
      if (node && !node.contains(e.target as Node)) closeMenu()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointerDown, true)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onPointerDown, true)
    }
  }, [menu, closeMenu])

  const openRowMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const { x, y } = clampMenuPosition(e.clientX, e.clientY)
    setMenu({ kind: 'row', index, x, y })
  }

  const openPanelMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const { x, y } = clampMenuPosition(e.clientX, e.clientY)
    setMenu({ kind: 'panel', x, y })
  }

  const menuButtonClass =
    'w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface-hover rounded-none transition-colors'

  const renderContextMenu = () => {
    if (!menu) return null

    return (
      <div
        ref={menuRef}
        id="playlist-context-menu"
        role="menu"
        className="fixed z-[100] min-w-[200px] py-1 rounded-lg border border-border bg-surface shadow-xl"
        style={{ left: menu.x, top: menu.y }}
      >
        {menu.kind === 'row' ? (
          <>
            <button
              type="button"
              role="menuitem"
              className={menuButtonClass}
              onClick={() => {
                void playQueueItemAt(menu.index)
                closeMenu()
              }}
            >
              立即播放
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuButtonClass}
              onClick={() => {
                void pickFilesAndAppendToQueue(menu.index)
                closeMenu()
              }}
            >
              在下方添加文件…
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              className={`${menuButtonClass} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
              onClick={() => {
                void removeQueueItemAt(menu.index)
                closeMenu()
              }}
            >
              从列表移除
            </button>
          </>
        ) : (
          <button
            type="button"
            role="menuitem"
            className={menuButtonClass}
            onClick={() => {
              void pickFilesAndAppendToQueue(undefined)
              closeMenu()
            }}
          >
            添加文件到列表…
          </button>
        )}
      </div>
    )
  }

  if (playQueue.length === 0) {
    return (
      <>
        <div
          className="w-72 shrink-0 border-l border-border bg-surface flex flex-col"
          onContextMenu={openPanelMenu}
        >
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">播放列表</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 text-center text-xs text-text-muted select-none">
            打开或拖入多个文件后将显示列表
            <br />
            <span className="text-text-muted/70 mt-2 inline-block">右键可添加文件</span>
          </div>
        </div>
        {renderContextMenu()}
      </>
    )
  }

  return (
    <>
      <div
        className="w-72 shrink-0 border-l border-border bg-surface flex flex-col min-h-0"
        onContextMenu={(e) => {
          if ((e.target as HTMLElement).closest('[data-playlist-item]')) return
          openPanelMenu(e)
        }}
      >
        <div
          className="px-3 py-2 border-b border-border flex items-center justify-between gap-2 shrink-0 select-none"
          onContextMenu={openPanelMenu}
        >
          <span className="text-sm font-medium text-text-primary truncate">
            播放列表 ({playQueue.length})
          </span>
          <button
            type="button"
            onClick={() => {
              void clearQueue()
            }}
            className="text-xs text-text-secondary hover:text-red-400 px-2 py-1 rounded hover:bg-surface-hover shrink-0"
          >
            清空
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto py-1 min-h-0">
          {playQueue.map((path, index) => {
            const isCurrent =
              index === currentQueueIndex || (currentFile !== null && path === currentFile)
            return (
              <li
                key={`${path}-${index}`}
                data-playlist-item
                onContextMenu={(e) => openRowMenu(e, index)}
                onDoubleClick={(e) => {
                  e.preventDefault()
                  void playQueueItemAt(index)
                }}
                className={`group flex items-center gap-1 px-2 py-1.5 mx-1 rounded-md ${
                  isCurrent ? 'bg-accent/15 border border-accent/40' : 'hover:bg-surface-hover'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    void playQueueItemAt(index)
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  <span
                    className={`text-xs block truncate ${
                      isCurrent ? 'text-accent font-medium' : 'text-text-primary'
                    }`}
                  >
                    {basename(path)}
                  </span>
                </button>
                <button
                  type="button"
                  title="从列表移除"
                  onClick={() => {
                    void removeQueueItemAt(index)
                  }}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-surface-light shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      {renderContextMenu()}
    </>
  )
}
