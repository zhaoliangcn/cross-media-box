import { create } from 'zustand'
import { MediaItem, Playlist, ScanProgress, MediaFilter } from '../types/media'

interface LibraryStore {
  mediaList: MediaItem[]
  playlists: Playlist[]
  scanProgress: ScanProgress | null
  isScanning: boolean
  filter: MediaFilter
  selectedPlaylistId: number | null
  setMediaList: (list: MediaItem[]) => void
  setPlaylists: (playlists: Playlist[]) => void
  setScanProgress: (progress: ScanProgress | null) => void
  setIsScanning: (scanning: boolean) => void
  setFilter: (filter: MediaFilter) => void
  setSelectedPlaylistId: (id: number | null) => void
  addPlaylist: (playlist: Playlist) => void
  removePlaylist: (id: number) => void
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  mediaList: [],
  playlists: [],
  scanProgress: null,
  isScanning: false,
  filter: {},
  selectedPlaylistId: null,
  setMediaList: (list) => set({ mediaList: list }),
  setPlaylists: (playlists) => set({ playlists }),
  setScanProgress: (progress) => set({ scanProgress: progress }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setFilter: (filter) => set({ filter }),
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id }),
  addPlaylist: (playlist) =>
    set((prev) => ({ playlists: [...prev.playlists, playlist] })),
  removePlaylist: (id) =>
    set((prev) => ({
      playlists: prev.playlists.filter((p) => p.id !== id)
    }))
}))
