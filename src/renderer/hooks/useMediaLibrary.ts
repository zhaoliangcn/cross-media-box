import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '../stores/libraryStore'
import { MediaItem, Playlist } from '../types/media'
import { playQueueFromPaths } from '../lib/playbackActions'

export function useInitializeLibrary() {
  const setMediaList = useLibraryStore((s) => s.setMediaList)
  const setPlaylists = useLibraryStore((s) => s.setPlaylists)

  useEffect(() => {
    loadMedia()
    loadPlaylists()
  }, [setMediaList, setPlaylists])

  const loadMedia = async () => {
    if (!window.electronAPI) return
    const media = await window.electronAPI.library.getMedia()
    setMediaList(media as MediaItem[])
  }

  const loadPlaylists = async () => {
    if (!window.electronAPI) return
    const playlists = await window.electronAPI.library.getPlaylists()
    setPlaylists(playlists as Playlist[])
  }
}

export function useMediaLibrary() {
  const navigate = useNavigate()

  const scan = async () => {
    if (!window.electronAPI) return
    const dirs = await window.electronAPI.dialog.openDirectory()
    if (dirs.length > 0) {
      useLibraryStore.getState().setIsScanning(true)
      await window.electronAPI.library.scan(dirs)
      useLibraryStore.getState().setIsScanning(false)
      const media = await window.electronAPI.library.getMedia()
      useLibraryStore.getState().setMediaList(media as MediaItem[])
    }
  }

  const refresh = async () => {
    if (!window.electronAPI) return
    const media = await window.electronAPI.library.getMedia()
    useLibraryStore.getState().setMediaList(media as MediaItem[])
    const playlists = await window.electronAPI.library.getPlaylists()
    useLibraryStore.getState().setPlaylists(playlists as Playlist[])
  }

  const playMedia = async (filePath: string, queuePaths?: string[]) => {
    if (!window.electronAPI) return
    const paths = queuePaths?.length ? queuePaths : [filePath]
    const idx = paths.indexOf(filePath)
    await playQueueFromPaths(paths, idx >= 0 ? idx : 0)
    navigate('/')
  }

  const createPlaylist = async (name: string, description?: string) => {
    if (!window.electronAPI) return
    const playlist = await window.electronAPI.library.createPlaylist(name, description)
    useLibraryStore.getState().addPlaylist(playlist as Playlist)
  }

  const deletePlaylist = async (id: number) => {
    if (!window.electronAPI) return
    await window.electronAPI.library.deletePlaylist(id)
    useLibraryStore.getState().removePlaylist(id)
  }

  return { scan, refresh, playMedia, createPlaylist, deletePlaylist }
}
