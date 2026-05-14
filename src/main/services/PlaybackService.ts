import { EventEmitter } from 'events'

export interface MediaMetadata {
  filePath: string
  fileName: string
  duration: number
  format: string
  resolution?: string
  bitrate?: number
  codec?: string
  audioCodec?: string
  audioChannels?: number
}

export type PlaybackAction = 'play' | 'pause' | 'stop' | 'seek' | 'volume' | 'speed' | 'mute'

export interface PlaybackState {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  speed: number
  currentFile: string | null
}

/**
 * 主进程仅维护与 IPC 控制相关的轻量状态；真实播放进度与时长由渲染进程 <video> 负责。
 * 不再使用定时器模拟进度，避免与真实媒体不同步（进度条超出时长、无法触发 ended 切歌等）。
 */
export class PlaybackService extends EventEmitter {
  private state: PlaybackState = {
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    speed: 1,
    currentFile: null
  }

  open(filePath: string): MediaMetadata {
    const pathParts = filePath.replace(/\\/g, '/').split('/')
    const fileName = pathParts[pathParts.length - 1] || 'unknown'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'unknown'

    const metadata: MediaMetadata = {
      filePath,
      fileName,
      duration: 0,
      format: ext,
      codec: 'h264',
      audioCodec: 'aac',
      audioChannels: 2
    }

    this.state = {
      ...this.state,
      playing: true,
      currentTime: 0,
      duration: 0,
      currentFile: filePath
    }

    this.emit('state-change', { ...this.state })
    return metadata
  }

  control(action: PlaybackAction, value?: number): void {
    switch (action) {
      case 'play':
        this.state.playing = true
        break
      case 'pause':
        this.state.playing = false
        break
      case 'stop':
        this.state.playing = false
        this.state.currentTime = 0
        this.state.currentFile = null
        break
      case 'seek':
        if (value !== undefined) {
          const d = this.state.duration
          this.state.currentTime =
            d > 0 ? Math.max(0, Math.min(value, d)) : Math.max(0, value)
        }
        break
      case 'volume':
        if (value !== undefined) {
          this.state.volume = Math.max(0, Math.min(1, value))
          this.state.muted = this.state.volume === 0
        }
        break
      case 'mute':
        this.state.muted = !this.state.muted
        break
      case 'speed':
        if (value !== undefined) {
          this.state.speed = Math.max(0.25, Math.min(4, value))
        }
        break
    }

    this.emit('state-change', { ...this.state })
  }

  getState(): PlaybackState {
    return { ...this.state }
  }

  close(): void {
    this.state = {
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      speed: 1,
      currentFile: null
    }
  }
}

export const playbackService = new PlaybackService()
