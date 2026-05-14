import { usePlayerStore } from '../stores/playerStore'
import {
  playQueueFromPaths,
  clearPlayQueue,
  playAdjacent,
  loadPathIntoPlayer,
  appendPathsToQueue
} from '../lib/playbackActions'
import { seekVideo } from '../components/player/VideoCanvas'

/**
 * 播放进度与总时长以渲染进程 <video> 为唯一数据源；主进程不再推送 time-update，
 * state-change 若同步到 store 会与真实媒体冲突（假时长 120s、进度超出等），故不在此订阅。
 */
export function useInitializePlayback(): void {
  // 进度与时长仅由 <video> 与 playerStore 维护，见文件头注释
}

export function usePlayback() {
  const openFile = async () => {
    if (!window.electronAPI) return
    const files = await window.electronAPI.dialog.openFile()
    if (files.length > 0) {
      await playQueueFromPaths(files, 0)
    }
  }

  const control = (action: string, value?: number) => {
    if (action !== 'seek') {
      window.electronAPI?.playback.control(action, value)
    }

    if (action === 'play') {
      usePlayerStore.getState().setPlaybackState({
        ...usePlayerStore.getState().playbackState,
        playing: true
      })
    } else if (action === 'pause') {
      usePlayerStore.getState().setPlaybackState({
        ...usePlayerStore.getState().playbackState,
        playing: false
      })
    } else if (action === 'stop') {
      usePlayerStore.getState().setPlaybackState({
        playing: false,
        currentTime: 0,
        duration: 0,
        volume: usePlayerStore.getState().playbackState.volume,
        muted: usePlayerStore.getState().playbackState.muted,
        speed: usePlayerStore.getState().playbackState.speed,
        currentFile: null
      })
      usePlayerStore.getState().setCurrentMetadata(null)
      usePlayerStore.getState().setCurrentQueueIndex(-1)
    } else if (action === 'seek' && value !== undefined) {
      seekVideo(value)
      usePlayerStore.getState().updateTime(value)
    } else if (action === 'volume' && value !== undefined) {
      usePlayerStore.getState().setPlaybackState({
        ...usePlayerStore.getState().playbackState,
        volume: value,
        muted: value === 0
      })
    } else if (action === 'mute') {
      const current = usePlayerStore.getState().playbackState
      usePlayerStore.getState().setPlaybackState({
        ...current,
        muted: !current.muted
      })
    } else if (action === 'speed' && value !== undefined) {
      usePlayerStore.getState().setPlaybackState({
        ...usePlayerStore.getState().playbackState,
        speed: value
      })
    }
  }

  const stop = () => {
    window.electronAPI?.playback.close()
    usePlayerStore.getState().setPlaybackState({
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: usePlayerStore.getState().playbackState.volume,
      muted: usePlayerStore.getState().playbackState.muted,
      speed: usePlayerStore.getState().playbackState.speed,
      currentFile: null
    })
    usePlayerStore.getState().setCurrentMetadata(null)
    usePlayerStore.getState().setCurrentQueueIndex(-1)
  }

  const playPrevious = () => {
    void playAdjacent(-1)
  }

  const playNext = () => {
    void playAdjacent(1)
  }

  const playQueueItemAt = async (index: number) => {
    const { playQueue } = usePlayerStore.getState()
    if (index < 0 || index >= playQueue.length) return
    usePlayerStore.getState().setCurrentQueueIndex(index)
    await loadPathIntoPlayer(playQueue[index])
  }

  /** 打开系统文件选择并将所选文件插入队列（`insertAfterIndex` 缺省为末尾） */
  const pickFilesAndAppendToQueue = async (insertAfterIndex?: number) => {
    if (!window.electronAPI) return
    const files = await window.electronAPI.dialog.openFile()
    if (files.length > 0) {
      await appendPathsToQueue(files, insertAfterIndex)
    }
  }

  return {
    openFile,
    control,
    stop,
    clearQueue: clearPlayQueue,
    playPrevious,
    playNext,
    playQueueItemAt,
    pickFilesAndAppendToQueue
  }
}
