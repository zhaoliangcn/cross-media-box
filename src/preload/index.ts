import { contextBridge, ipcRenderer } from 'electron'

const api = {
  playback: {
    open: (filePath: string) => ipcRenderer.invoke('playback:open', filePath),
    control: (action: string, value?: number) => ipcRenderer.invoke('playback:control', action, value),
    getState: () => ipcRenderer.invoke('playback:get-state'),
    close: () => ipcRenderer.invoke('playback:close'),
    onStateChange: (callback: (state: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: unknown) => callback(state)
      ipcRenderer.on('playback:state-change', handler)
      return () => ipcRenderer.removeListener('playback:state-change', handler)
    },
    onTimeUpdate: (callback: (time: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, time: number) => callback(time)
      ipcRenderer.on('playback:time-update', handler)
      return () => ipcRenderer.removeListener('playback:time-update', handler)
    }
  },
  transcode: {
    start: (job: unknown) => ipcRenderer.invoke('transcode:start', job),
    cancel: (jobId: string) => ipcRenderer.invoke('transcode:cancel', jobId),
    getJobs: () => ipcRenderer.invoke('transcode:get-jobs'),
    onProgress: (callback: (progress: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: unknown) => callback(progress)
      ipcRenderer.on('transcode:progress', handler)
      return () => ipcRenderer.removeListener('transcode:progress', handler)
    }
  },
  library: {
    scan: (directories: string[]) => ipcRenderer.invoke('library:scan', directories),
    getMedia: (filter?: unknown) => ipcRenderer.invoke('library:get-media', filter),
    getCount: () => ipcRenderer.invoke('library:get-count'),
    getRecent: (limit?: number) => ipcRenderer.invoke('library:get-recent', limit),
    createPlaylist: (name: string, description?: string) => ipcRenderer.invoke('library:create-playlist', name, description),
    getPlaylists: () => ipcRenderer.invoke('library:get-playlists'),
    deletePlaylist: (id: number) => ipcRenderer.invoke('library:delete-playlist', id),
    addToPlaylist: (playlistId: number, mediaId: number) => ipcRenderer.invoke('library:add-to-playlist', playlistId, mediaId),
    removeFromPlaylist: (playlistId: number, mediaId: number) => ipcRenderer.invoke('library:remove-from-playlist', playlistId, mediaId),
    getPlaylistMedia: (playlistId: number) => ipcRenderer.invoke('library:get-playlist-media', playlistId),
    onScanProgress: (callback: (progress: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: unknown) => callback(progress)
      ipcRenderer.on('library:scan-progress', handler)
      return () => ipcRenderer.removeListener('library:scan-progress', handler)
    },
    onScanComplete: (callback: (result: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, result: unknown) => callback(result)
      ipcRenderer.on('library:scan-complete', handler)
      return () => ipcRenderer.removeListener('library:scan-complete', handler)
    }
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('settings:delete', key),
    getAll: () => ipcRenderer.invoke('settings:get-all')
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized')
  },
  dialog: {
    openFile: (options?: unknown) => ipcRenderer.invoke('dialog:open-file', options),
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
    saveFile: (options?: unknown) => ipcRenderer.invoke('dialog:save-file', options)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
