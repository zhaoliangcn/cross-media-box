import { useEffect } from 'react'
import { useTranscodeStore } from '../stores/transcodeStore'
import { TranscodeProgress, TranscodeJob } from '../types/media'

export function useInitializeTranscode() {
  const updateProgress = useTranscodeStore((s) => s.updateProgress)

  useEffect(() => {
    if (!window.electronAPI) return

    const unsub = window.electronAPI.transcode.onProgress((progress) => {
      updateProgress(progress as TranscodeProgress)
    })

    return () => {
      unsub()
    }
  }, [updateProgress])
}

export function useTranscode() {
  const start = async (job: Omit<TranscodeJob, 'id'>) => {
    if (!window.electronAPI) return
    const created = await window.electronAPI.transcode.start(job)
    useTranscodeStore.getState().addJob(created as TranscodeJob)
    return created as TranscodeJob
  }

  const cancel = async (jobId: string) => {
    if (!window.electronAPI) return
    await window.electronAPI.transcode.cancel(jobId)
    useTranscodeStore.getState().removeJob(jobId)
  }

  const loadJobs = async () => {
    if (!window.electronAPI) return
    const jobs = await window.electronAPI.transcode.getJobs()
    useTranscodeStore.getState().setJobs(jobs as TranscodeJob[])
  }

  return { start, cancel, loadJobs }
}
