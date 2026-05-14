export interface MediaItem {
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
  has_subtitle: number
  cover_path: string | null
  created_at: string
  updated_at: string
}

export interface PlaybackState {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  speed: number
  currentFile: string | null
}

export interface TranscodeJob {
  id: string
  inputPath: string
  outputPath: string
  outputFormat: string
  videoCodec: string
  audioCodec: string
  resolution?: string
  bitrate?: number
  startTime?: number
  endTime?: number
  cropRegion?: { x: number; y: number; width: number; height: number }
  extractAudio: boolean
}

export interface TranscodeProgress {
  jobId: string
  percent: number
  currentTime: number
  totalTime: number
  eta: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
}

export interface Playlist {
  id: number
  name: string
  description: string | null
  cover_path: string | null
  created_at: string
  updated_at: string
}

export interface ScanProgress {
  current: number
  total: number
  currentFile: string
}

export interface MediaFilter {
  format?: string
  search?: string
  limit?: number
  offset?: number
}
