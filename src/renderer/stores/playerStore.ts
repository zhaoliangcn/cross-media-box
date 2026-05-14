import { create } from 'zustand'
import { PlaybackState } from '../types/media'

interface PlayerStore {
  playbackState: PlaybackState
  currentMetadata: {
    fileName: string
    duration: number
    format: string
    resolution?: string
  } | null
  playQueue: string[]
  currentQueueIndex: number
  playlistPanelOpen: boolean
  setPlaybackState: (state: PlaybackState) => void
  setCurrentMetadata: (metadata: PlayerStore['currentMetadata']) => void
  updateTime: (time: number) => void
  setPlayQueue: (paths: string[]) => void
  setCurrentQueueIndex: (index: number) => void
  setPlaylistPanelOpen: (open: boolean) => void
  togglePlaylistPanel: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  playbackState: {
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    speed: 1,
    currentFile: null
  },
  currentMetadata: null,
  playQueue: [],
  currentQueueIndex: -1,
  playlistPanelOpen: false,
  setPlaybackState: (state) => set({ playbackState: state }),
  setCurrentMetadata: (metadata) => set({ currentMetadata: metadata }),
  updateTime: (time) =>
    set((prev) => {
      const d = prev.playbackState.duration
      let t = Math.max(0, time)
      if (Number.isFinite(d) && d > 0) {
        t = Math.min(t, d)
      }
      return { playbackState: { ...prev.playbackState, currentTime: t } }
    }),
  setPlayQueue: (paths) => set({ playQueue: paths }),
  setCurrentQueueIndex: (index) => set({ currentQueueIndex: index }),
  setPlaylistPanelOpen: (open) => set({ playlistPanelOpen: open }),
  togglePlaylistPanel: () => set((s) => ({ playlistPanelOpen: !s.playlistPanelOpen }))
}))
