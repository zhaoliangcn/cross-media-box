import { EventEmitter } from 'events'
import { statSync, readdirSync } from 'fs'
import { join, extname, basename } from 'path'
import {
  insertMedia, findAllMedia, countMedia,
  createPlaylist as dbCreatePlaylist, findAllPlaylists,
  deletePlaylist as dbDeletePlaylist,
  addMediaToPlaylist, removeMediaFromPlaylist,
  getPlaylistMediaIds,
  getRecentlyPlayed,
  MediaRow, PlaylistRow
} from '../db/database'
import { logger } from '../utils/logger'

const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg',
  '.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a', '.opus',
  '.ts', '.rmvb', '.vob', '.3gp', '.asf', '.f4v'
])

export interface ScanProgress {
  current: number
  total: number
  currentFile: string
}

export class LibraryService extends EventEmitter {
  scan(directories: string[]): { totalFiles: number } {
    const allFiles: string[] = []

    for (const dir of directories) {
      try {
        this.collectMediaFiles(dir, allFiles)
      } catch (err) {
        logger.error(`Failed to scan directory: ${dir}`, err)
      }
    }

    const total = allFiles.length
    logger.info(`Found ${total} media files to index`)

    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i]
      this.indexFile(filePath)

      this.emit('scan-progress', {
        current: i + 1,
        total,
        currentFile: filePath
      } as ScanProgress)
    }

    this.emit('scan-complete', { totalFiles: total })
    return { totalFiles: total }
  }

  getMediaCount(): number {
    return countMedia()
  }

  getRecentlyPlayed(limit?: number) {
    return getRecentlyPlayed(limit)
  }

  createPlaylist(name: string, description?: string): PlaylistRow {
    return dbCreatePlaylist(name, description)
  }

  getPlaylists(): PlaylistRow[] {
    return findAllPlaylists()
  }

  deletePlaylist(id: number): void {
    dbDeletePlaylist(id)
  }

  addToPlaylist(playlistId: number, mediaId: number): void {
    addMediaToPlaylist(playlistId, mediaId)
  }

  removeFromPlaylist(playlistId: number, mediaId: number): void {
    removeMediaFromPlaylist(playlistId, mediaId)
  }

  getPlaylistMediaIds(playlistId: number): number[] {
    return getPlaylistMediaIds(playlistId)
  }

  private collectMediaFiles(dir: string, result: string[]): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          this.collectMediaFiles(fullPath, result)
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase()
          if (MEDIA_EXTENSIONS.has(ext)) {
            result.push(fullPath)
          }
        }
      }
    } catch {
      // skip inaccessible directories
    }
  }

  private indexFile(filePath: string): void {
    try {
      const stats = statSync(filePath)
      const fileName = basename(filePath)
      const ext = extname(filePath).toLowerCase().replace('.', '')

      insertMedia({
        file_path: filePath,
        file_name: fileName,
        file_size: stats.size,
        duration: null,
        format: ext,
        resolution: null,
        bitrate: null,
        codec: null,
        audio_codec: null,
        audio_channels: null,
        has_subtitle: false,
        cover_path: null
      })
    } catch (err) {
      logger.error(`Failed to index file: ${filePath}`, err)
    }
  }
}

export const libraryService = new LibraryService()
