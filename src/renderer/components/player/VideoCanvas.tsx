import { useRef, useEffect, useCallback } from 'react'
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

  // 切换文件时必须 load()，此时浏览器会暂停；若 playing 仍为 true，仅依赖 [playing] 的 effect 不会再次执行 play()，导致无画面/无声音。
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!playbackState.currentFile) {
      video.pause()
      video.removeAttribute('src')
      video.load()
      return
    }

    const url = `local-file://${encodeURIComponent(playbackState.currentFile)}`
    video.src = url
    video.load()
  }, [playbackState.currentFile])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackState.currentFile) return

    if (!playbackState.playing) {
      video.pause()
      return
    }

    const tryPlay = () => {
      void video.play().catch(() => {})
    }

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      tryPlay()
    } else {
      video.addEventListener('canplay', tryPlay, { once: true })
    }

    return () => {
      video.removeEventListener('canplay', tryPlay)
    }
  }, [playbackState.currentFile, playbackState.playing])

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
    />
  )
}
