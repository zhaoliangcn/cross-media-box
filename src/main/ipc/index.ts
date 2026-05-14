import { ipcMain, dialog } from 'electron'
import Store from 'electron-store'
import { windowManager } from '../window/WindowManager'
import { playbackService } from '../services/PlaybackService'
import { transcodeService } from '../services/TranscodeService'
import { libraryService } from '../services/LibraryService'
import {
  findMediaByFilePath, findAllMedia, MediaFilter,
  upsertHistory
} from '../db/database'
import { logger } from '../utils/logger'

export function registerAllIpcHandlers(): void {
  registerPlaybackHandlers()
  registerTranscodeHandlers()
  registerLibraryHandlers()
  registerSettingsHandlers()
  registerWindowHandlers()
  registerDialogHandlers()
  logger.info('All IPC handlers registered')
}

function registerPlaybackHandlers(): void {
  ipcMain.handle('playback:open', (_event, filePath: string) => {
    const metadata = playbackService.open(filePath)
    const media = findMediaByFilePath(filePath)
    if (media) {
      upsertHistory(media.id, 0)
    }
    return metadata
  })

  ipcMain.handle('playback:control', (_event, action: string, value?: number) => {
    playbackService.control(action as 'play' | 'pause' | 'stop' | 'seek' | 'volume' | 'speed' | 'mute', value)
  })

  ipcMain.handle('playback:get-state', () => {
    return playbackService.getState()
  })

  ipcMain.handle('playback:close', () => {
    playbackService.close()
  })

  playbackService.on('state-change', (state) => {
    try {
      const win = windowManager.getMainWindow()
      if (win && !win.webContents.isDestroyed()) {
        win.webContents.send('playback:state-change', state)
      }
    } catch {
      // Window was destroyed during send, ignore
    }
  })
}

function registerTranscodeHandlers(): void {
  ipcMain.handle('transcode:start', (_event, job) => {
    const created = transcodeService.start(job)
    return created
  })

  ipcMain.handle('transcode:cancel', (_event, jobId: string) => {
    transcodeService.cancel(jobId)
  })

  ipcMain.handle('transcode:get-jobs', () => {
    return transcodeService.getAllJobs()
  })

  transcodeService.on('progress', (progress) => {
    try {
      const win = windowManager.getMainWindow()
      if (win && !win.webContents.isDestroyed()) {
        win.webContents.send('transcode:progress', progress)
      }
    } catch {
      // Window was destroyed during send, ignore
    }
  })
}

function registerLibraryHandlers(): void {
  ipcMain.handle('library:scan', (_event, directories: string[]) => {
    const result = libraryService.scan(directories)
    return result
  })

  ipcMain.handle('library:get-media', (_event, filter?: MediaFilter) => {
    return findAllMedia(filter)
  })

  ipcMain.handle('library:get-count', () => {
    return libraryService.getMediaCount()
  })

  ipcMain.handle('library:get-recent', (_event, limit?: number) => {
    return libraryService.getRecentlyPlayed(limit)
  })

  ipcMain.handle('library:create-playlist', (_event, name: string, description?: string) => {
    return libraryService.createPlaylist(name, description)
  })

  ipcMain.handle('library:get-playlists', () => {
    return libraryService.getPlaylists()
  })

  ipcMain.handle('library:delete-playlist', (_event, id: number) => {
    libraryService.deletePlaylist(id)
  })

  ipcMain.handle('library:add-to-playlist', (_event, playlistId: number, mediaId: number) => {
    libraryService.addToPlaylist(playlistId, mediaId)
  })

  ipcMain.handle('library:remove-from-playlist', (_event, playlistId: number, mediaId: number) => {
    libraryService.removeFromPlaylist(playlistId, mediaId)
  })

  ipcMain.handle('library:get-playlist-media', (_event, playlistId: number) => {
    const mediaIds = libraryService.getPlaylistMediaIds(playlistId)
    return mediaIds.map((id) => findAllMedia().find((r) => r.id === id)).filter(Boolean)
  })

  libraryService.on('scan-progress', (progress) => {
    try {
      const win = windowManager.getMainWindow()
      if (win && !win.webContents.isDestroyed()) {
        win.webContents.send('library:scan-progress', progress)
      }
    } catch {
      // Window was destroyed during send, ignore
    }
  })

  libraryService.on('scan-complete', (result) => {
    try {
      const win = windowManager.getMainWindow()
      if (win && !win.webContents.isDestroyed()) {
        win.webContents.send('library:scan-complete', result)
      }
    } catch {
      // Window was destroyed during send, ignore
    }
  })
}

function registerSettingsHandlers(): void {
  const store = new Store()

  ipcMain.handle('settings:get', (_event, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    store.set(key, value)
  })

  ipcMain.handle('settings:delete', (_event, key: string) => {
    store.delete(key)
  })

  ipcMain.handle('settings:get-all', () => {
    return store.store
  })
}

function registerWindowHandlers(): void {
  ipcMain.handle('window:minimize', () => windowManager.minimize())
  ipcMain.handle('window:maximize', () => windowManager.maximize())
  ipcMain.handle('window:close', () => windowManager.close())
  ipcMain.handle('window:is-maximized', () => windowManager.getMainWindow()?.isMaximized() ?? false)
}

function registerDialogHandlers(): void {
  ipcMain.handle('dialog:open-file', async (_event, options: Electron.OpenDialogOptions) => {
    const win = windowManager.getMainWindow()
    if (!win) return []
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      ...options,
      filters: options?.filters || [
        { name: '媒体文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mp3', 'flac', 'wav', 'm4a'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('dialog:open-directory', async () => {
    const win = windowManager.getMainWindow()
    if (!win) return []
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'multiSelections']
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('dialog:save-file', async (_event, options: Electron.SaveDialogOptions) => {
    const win = windowManager.getMainWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, options)
    return result.canceled ? null : result.filePath
  })
}
