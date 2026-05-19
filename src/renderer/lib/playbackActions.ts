import { usePlayerStore } from '../stores/playerStore'

function normalizeMediaPath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase()
}

/** 以正在播放的文件路径为准解析队列下标，避免 currentQueueIndex 与 UI 不同步时切歌错误（例如重复播放第一首）。 */
function resolveQueueIndexForCurrentFile(
  playQueue: string[],
  currentQueueIndex: number,
  currentFile: string | null
): number {
  if (currentFile) {
    const key = normalizeMediaPath(currentFile)
    const i = playQueue.findIndex((q) => normalizeMediaPath(q) === key)
    if (i !== -1) return i
  }
  return currentQueueIndex
}

export async function loadPathIntoPlayer(filePath: string): Promise<void> {
  const isUrl = filePath.startsWith('http://') || filePath.startsWith('https://')
  const fileName = isUrl ? (filePath.split('/').pop() || filePath) : filePath
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  if (!isUrl && window.electronAPI) {
    const metadata = await window.electronAPI.playback.open(filePath)
    const meta = metadata as {
      fileName: string
      duration: number
      format: string
      resolution?: string
    }
    usePlayerStore.getState().setCurrentMetadata({
      fileName: meta.fileName,
      duration: 0,
      format: meta.format,
      resolution: meta.resolution
    })
  } else {
    usePlayerStore.getState().setCurrentMetadata({
      fileName,
      duration: 0,
      format: ext,
      resolution: undefined
    })
  }

  const { playQueue } = usePlayerStore.getState()
  const inQueue = playQueue.findIndex((q) => normalizeMediaPath(q) === normalizeMediaPath(filePath))
  if (inQueue !== -1) {
    usePlayerStore.getState().setCurrentQueueIndex(inQueue)
  }
  usePlayerStore.getState().setPlaybackState({
    ...usePlayerStore.getState().playbackState,
    currentFile: filePath,
    playing: true,
    currentTime: 0,
    duration: 0
  })
}

export async function playQueueFromPaths(paths: string[], startIndex = 0): Promise<void> {
  const list = paths.filter(Boolean)
  if (!list.length) return
  const i = Math.min(Math.max(0, startIndex), list.length - 1)
  usePlayerStore.getState().setPlayQueue(list)
  usePlayerStore.getState().setCurrentQueueIndex(i)
  await loadPathIntoPlayer(list[i])
}

export async function playAdjacent(delta: number): Promise<void> {
  const { playQueue, currentQueueIndex, playbackState } = usePlayerStore.getState()
  const idx = resolveQueueIndexForCurrentFile(
    playQueue,
    currentQueueIndex,
    playbackState.currentFile
  )
  const next = idx + delta
  if (next < 0 || next >= playQueue.length) return
  usePlayerStore.getState().setCurrentQueueIndex(next)
  await loadPathIntoPlayer(playQueue[next])
}

export async function playNextFromEnded(): Promise<void> {
  const { playQueue, currentQueueIndex, playbackState } = usePlayerStore.getState()
  if (playQueue.length === 0) {
    usePlayerStore.getState().setPlaybackState({
      ...playbackState,
      playing: false
    })
    return
  }

  const idx = resolveQueueIndexForCurrentFile(
    playQueue,
    currentQueueIndex,
    playbackState.currentFile
  )
  const next = idx + 1
  if (next < playQueue.length) {
    usePlayerStore.getState().setCurrentQueueIndex(next)
    await loadPathIntoPlayer(playQueue[next])
  } else {
    usePlayerStore.getState().setPlaybackState({
      ...playbackState,
      playing: false
    })
  }
}

export async function removeQueueItemAt(index: number): Promise<void> {
  const { playQueue, currentQueueIndex, playbackState } = usePlayerStore.getState()
  if (index < 0 || index >= playQueue.length) return

  const newQueue = playQueue.filter((_, i) => i !== index)
  let newIndex = currentQueueIndex

  if (index < currentQueueIndex) {
    newIndex = currentQueueIndex - 1
  } else if (index === currentQueueIndex) {
    if (newQueue.length === 0) {
      window.electronAPI?.playback.close()
      usePlayerStore.getState().setPlaybackState({
        playing: false,
        currentTime: 0,
        duration: 0,
        volume: playbackState.volume,
        muted: playbackState.muted,
        speed: playbackState.speed,
        currentFile: null
      })
      usePlayerStore.getState().setCurrentMetadata(null)
      newIndex = -1
    } else {
      newIndex = Math.min(index, newQueue.length - 1)
      await loadPathIntoPlayer(newQueue[newIndex])
    }
  }

  usePlayerStore.getState().setPlayQueue(newQueue)
  usePlayerStore.getState().setCurrentQueueIndex(newIndex)
}

/** 将路径加入队列。`insertAfterIndex` 为 `undefined` 时表示追加到末尾；否则插在该下标之后。 */
export async function appendPathsToQueue(
  paths: string[],
  insertAfterIndex?: number
): Promise<void> {
  const deduped = paths.filter(Boolean)
  if (!deduped.length) return

  const { playQueue, currentQueueIndex } = usePlayerStore.getState()
  const wasEmpty = playQueue.length === 0

  if (wasEmpty) {
    const newQueue = deduped
    usePlayerStore.getState().setPlayQueue(newQueue)
    usePlayerStore.getState().setCurrentQueueIndex(0)
    await loadPathIntoPlayer(newQueue[0])
    return
  }

  let newQueue: string[]
  let newCur: number

  if (insertAfterIndex === undefined) {
    newQueue = [...playQueue, ...deduped]
    newCur = currentQueueIndex
  } else {
    const pos = Math.min(insertAfterIndex + 1, playQueue.length)
    newQueue = [...playQueue.slice(0, pos), ...deduped, ...playQueue.slice(pos)]
    newCur = currentQueueIndex >= pos ? currentQueueIndex + deduped.length : currentQueueIndex
  }

  usePlayerStore.getState().setPlayQueue(newQueue)
  usePlayerStore.getState().setCurrentQueueIndex(newCur)
}

export async function clearPlayQueue(): Promise<void> {
  const { playbackState } = usePlayerStore.getState()
  window.electronAPI?.playback.close()
  usePlayerStore.getState().setPlaybackState({
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: playbackState.volume,
    muted: playbackState.muted,
    speed: playbackState.speed,
    currentFile: null
  })
  usePlayerStore.getState().setCurrentMetadata(null)
  usePlayerStore.getState().setPlayQueue([])
  usePlayerStore.getState().setCurrentQueueIndex(-1)
}
