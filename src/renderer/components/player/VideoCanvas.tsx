import { useRef, useEffect, useCallback, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { playNextFromEnded } from '../../lib/playbackActions'

let videoElement: HTMLVideoElement | null = null

export function seekVideo(time: number): void {
  if (!videoElement) {
    console.log('[seekVideo] no videoElement')
    return
  }
  const d = videoElement.duration
  const clamped = Number.isFinite(d) && d > 0 ? Math.max(0, Math.min(time, d)) : Math.max(0, time)
  console.log(`[seekVideo] time=${time.toFixed(2)} duration=${Number.isFinite(d) ? d.toFixed(2) : d} clamped=${clamped.toFixed(2)} readyState=${videoElement.readyState}`)
  videoElement.currentTime = clamped
}

/** 从 <video> 取可展示的总时长（部分音频在 loadedmetadata 时尚无 duration，需 durationchange / seekable） */
function getKnownDurationSeconds(video: HTMLVideoElement): number {
  const d = video.duration
  if (Number.isFinite(d) && d > 0 && d !== Number.POSITIVE_INFINITY) {
    return d
  }
  try {
    if (video.seekable && video.seekable.length > 0) {
      const end = video.seekable.end(video.seekable.length - 1)
      if (Number.isFinite(end) && end > 0 && end !== Number.POSITIVE_INFINITY) {
        return end
      }
    }
  } catch {
    /* ignore */
  }
  return 0
}

export default function VideoCanvas() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackState = usePlayerStore((s) => s.playbackState)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    videoElement = videoRef.current
    return () => {
      videoElement = null
    }
  }, [])

  const syncTimingFromVideo = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const mediaDuration = getKnownDurationSeconds(video)
    const prev = usePlayerStore.getState().currentMetadata
    const pb = usePlayerStore.getState().playbackState
    const resolution = `${video.videoWidth}x${video.videoHeight}`

    if (mediaDuration > 0) {
      usePlayerStore.getState().setCurrentMetadata({
        fileName: prev?.fileName ?? '',
        format: prev?.format ?? '',
        resolution,
        duration: mediaDuration
      })
      usePlayerStore.getState().setPlaybackState({
        ...pb,
        duration: mediaDuration,
        currentTime: Math.min(video.currentTime, mediaDuration)
      })
      return
    }

    usePlayerStore.getState().setCurrentMetadata({
      fileName: prev?.fileName ?? '',
      format: prev?.format ?? '',
      resolution,
      duration: 0
    })
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    syncTimingFromVideo()
  }, [syncTimingFromVideo])

  /** progress 高频触发：仅在从 seekable 解析出时长且与 store 不一致时更新 */
  const handleProgressDuration = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const mediaDuration = getKnownDurationSeconds(video)
    if (mediaDuration <= 0) return
    const pb = usePlayerStore.getState().playbackState
    if (Math.abs(mediaDuration - pb.duration) < 0.05) return
    syncTimingFromVideo()
  }, [syncTimingFromVideo])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    usePlayerStore.getState().updateTime(video.currentTime)
  }, [])

  const handleEnded = useCallback(() => {
    void playNextFromEnded()
  }, [])

  const handleError = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setLoading(false)
    const mediaError = video.error
    console.error('[VideoCanvas] Video error:', mediaError, 'src:', video.src)
    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          setError('播放被中止')
          break
        case MediaError.MEDIA_ERR_NETWORK:
          setError('网络错误，无法加载视频')
          break
        case MediaError.MEDIA_ERR_DECODE:
          setError('视频解码失败，格式可能不支持')
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          setError('视频源不支持，请检查视频格式或服务器是否正常运行')
          break
        default:
          setError('未知播放错误')
      }
    }
  }, [])

  const handleCanPlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setLoading(false)
    setError(null)
    video.play().catch((e) => {
      console.error('[VideoCanvas] Play failed:', e)
    })
  }, [])

  const handleWaiting = useCallback(() => {
    setLoading(true)
  }, [])

  const handlePlaying = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    setError(null)
    setLoading(true)
    const video = videoRef.current
    if (!video || !playbackState.currentFile) return

    const isUrl = playbackState.currentFile.startsWith('http://') || playbackState.currentFile.startsWith('https://')
    console.log('[VideoCanvas] Loading:', playbackState.currentFile, 'isUrl:', isUrl)
    const url = isUrl ? playbackState.currentFile : `local-file://${encodeURIComponent(playbackState.currentFile)}`
    video.src = url
    video.crossOrigin = isUrl ? 'anonymous' : ''
    video.load()
  }, [playbackState.currentFile])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (playbackState.playing) {
      video.play().catch((e) => {
        console.error('[VideoCanvas] Play failed:', e)
      })
    } else {
      video.pause()
    }
  }, [playbackState.playing])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = playbackState.muted ? 0 : playbackState.volume
  }, [playbackState.volume, playbackState.muted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackState.speed
  }, [playbackState.speed])

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain' }}
        loop={false}
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={syncTimingFromVideo}
        onProgress={handleProgressDuration}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm mt-3">加载中...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400 mx-auto mb-3">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}
    </>
  )
}
