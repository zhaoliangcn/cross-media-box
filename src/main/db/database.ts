import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { logger } from '../utils/logger'

interface StoreData {
  media: MediaRow[]
  playlists: PlaylistRow[]
  playlistMedia: PlaylistMediaRow[]
  playHistory: HistoryRow[]
  nextId: {
    media: number
    playlist: number
    history: number
  }
}

export interface MediaRow {
  id: number
  file_path: string
  file_name: string
  file_size: number | null
  duration: number | null
  format: string | null
  resolution: string | null
  bitrate: number | null
  codec: string | null
  audio_codec: string | null
  audio_channels: number | null
  has_subtitle: boolean
  cover_path: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistRow {
  id: number
  name: string
  description: string | null
  cover_path: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistMediaRow {
  playlist_id: number
  media_id: number
  sort_order: number
  added_at: string
}

export interface HistoryRow {
  id: number
  media_id: number
  last_position: number
  play_count: number
  last_played_at: string
}

export interface MediaFilter {
  format?: string
  search?: string
  limit?: number
  offset?: number
}

let data: StoreData
let dbPath: string

function getDefaultData(): StoreData {
  return {
    media: [],
    playlists: [],
    playlistMedia: [],
    playHistory: [],
    nextId: { media: 1, playlist: 1, history: 1 }
  }
}

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  dbPath = join(userDataPath, 'media-library.json')

  if (existsSync(dbPath)) {
    try {
      const raw = readFileSync(dbPath, 'utf-8')
      data = JSON.parse(raw)
      // ensure nextId exists for backward compatibility
      if (!data.nextId) {
        data.nextId = { media: 1, playlist: 1, history: 1 }
      }
    } catch {
      logger.error('Failed to parse database file, creating new one')
      data = getDefaultData()
    }
  } else {
    data = getDefaultData()
  }

  saveDatabase()
  logger.info(`Database initialized at ${dbPath}`)
}

function saveDatabase(): void {
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    logger.error('Failed to save database', err)
  }
}

export function closeDatabase(): void {
  saveDatabase()
}

// ---- Media Operations ----

export function insertMedia(media: Omit<MediaRow, 'id' | 'created_at' | 'updated_at'>): MediaRow {
  const existing = data.media.find((m) => m.file_path === media.file_path)
  const now = new Date().toISOString()
  if (existing) {
    Object.assign(existing, media, { updated_at: now })
    saveDatabase()
    return existing
  }
  const row: MediaRow = {
    ...media,
    id: data.nextId.media++,
    created_at: now,
    updated_at: now
  }
  data.media.push(row)
  saveDatabase()
  return row
}

export function findMediaByFilePath(filePath: string): MediaRow | undefined {
  return data.media.find((m) => m.file_path === filePath)
}

export function findAllMedia(filter?: MediaFilter): MediaRow[] {
  let results = [...data.media]

  if (filter?.format) {
    results = results.filter((m) => m.format === filter!.format)
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase()
    results = results.filter((m) => m.file_name.toLowerCase().includes(s))
  }

  results.sort((a, b) => b.created_at.localeCompare(a.created_at))

  if (filter?.offset) {
    results = results.slice(filter.offset)
  }
  if (filter?.limit) {
    results = results.slice(0, filter.limit)
  }

  return results
}

export function countMedia(): number {
  return data.media.length
}

export function deleteMediaByFilePath(filePath: string): void {
  const idx = data.media.findIndex((m) => m.file_path === filePath)
  if (idx !== -1) {
    const mediaId = data.media[idx].id
    data.media.splice(idx, 1)
    data.playlistMedia = data.playlistMedia.filter((pm) => pm.media_id !== mediaId)
    saveDatabase()
  }
}

export function deleteAllMedia(): void {
  data.media = []
  data.playlistMedia = []
  saveDatabase()
}

// ---- Playlist Operations ----

export function createPlaylist(name: string, description?: string): PlaylistRow {
  const now = new Date().toISOString()
  const row: PlaylistRow = {
    id: data.nextId.playlist++,
    name,
    description: description || null,
    cover_path: null,
    created_at: now,
    updated_at: now
  }
  data.playlists.push(row)
  saveDatabase()
  return row
}

export function findAllPlaylists(): PlaylistRow[] {
  return [...data.playlists].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function updatePlaylist(id: number, name: string, description?: string): void {
  const pl = data.playlists.find((p) => p.id === id)
  if (pl) {
    pl.name = name
    pl.description = description || null
    pl.updated_at = new Date().toISOString()
    saveDatabase()
  }
}

export function deletePlaylist(id: number): void {
  data.playlists = data.playlists.filter((p) => p.id !== id)
  data.playlistMedia = data.playlistMedia.filter((pm) => pm.playlist_id !== id)
  saveDatabase()
}

export function addMediaToPlaylist(playlistId: number, mediaId: number): void {
  const exists = data.playlistMedia.some((pm) => pm.playlist_id === playlistId && pm.media_id === mediaId)
  if (exists) return
  const maxOrder = data.playlistMedia
    .filter((pm) => pm.playlist_id === playlistId)
    .reduce((max, pm) => Math.max(max, pm.sort_order), 0)
  data.playlistMedia.push({
    playlist_id: playlistId,
    media_id: mediaId,
    sort_order: maxOrder + 1,
    added_at: new Date().toISOString()
  })
  saveDatabase()
}

export function removeMediaFromPlaylist(playlistId: number, mediaId: number): void {
  data.playlistMedia = data.playlistMedia.filter(
    (pm) => !(pm.playlist_id === playlistId && pm.media_id === mediaId)
  )
  saveDatabase()
}

export function getPlaylistMediaIds(playlistId: number): number[] {
  return data.playlistMedia
    .filter((pm) => pm.playlist_id === playlistId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pm) => pm.media_id)
}

// ---- History Operations ----

export function upsertHistory(mediaId: number, position: number): void {
  const existing = data.playHistory.find((h) => h.media_id === mediaId)
  const now = new Date().toISOString()
  if (existing) {
    existing.last_position = position
    existing.play_count++
    existing.last_played_at = now
  } else {
    data.playHistory.push({
      id: data.nextId.history++,
      media_id: mediaId,
      last_position: position,
      play_count: 1,
      last_played_at: now
    })
  }
  saveDatabase()
}

export function findHistoryByMediaId(mediaId: number): HistoryRow | undefined {
  return data.playHistory.find((h) => h.media_id === mediaId)
}

export function getRecentlyPlayed(limit = 20): (HistoryRow & { file_name: string; file_path: string })[] {
  return data.playHistory
    .sort((a, b) => b.last_played_at.localeCompare(a.last_played_at))
    .slice(0, limit)
    .map((h) => {
      const media = data.media.find((m) => m.id === h.media_id)
      return {
        ...h,
        file_name: media?.file_name || 'Unknown',
        file_path: media?.file_path || ''
      }
    })
}

export function clearHistory(): void {
  data.playHistory = []
  saveDatabase()
}
