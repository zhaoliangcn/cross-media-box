import { create } from 'zustand'
import { TranscodeJob, TranscodeProgress } from '../types/media'

interface TranscodeStore {
  jobs: TranscodeJob[]
  progressMap: Record<string, TranscodeProgress>
  addJob: (job: TranscodeJob) => void
  updateProgress: (progress: TranscodeProgress) => void
  removeJob: (jobId: string) => void
  setJobs: (jobs: TranscodeJob[]) => void
}

export const useTranscodeStore = create<TranscodeStore>((set) => ({
  jobs: [],
  progressMap: {},
  addJob: (job) =>
    set((prev) => ({ jobs: [...prev.jobs, job] })),
  updateProgress: (progress) =>
    set((prev) => ({
      progressMap: { ...prev.progressMap, [progress.jobId]: progress },
      jobs: prev.jobs.map((j) =>
        j.id === progress.jobId && (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled')
          ? { ...j }
          : j
      )
    })),
  removeJob: (jobId) =>
    set((prev) => ({
      jobs: prev.jobs.filter((j) => j.id !== jobId),
      progressMap: Object.fromEntries(
        Object.entries(prev.progressMap).filter(([id]) => id !== jobId)
      )
    })),
  setJobs: (jobs) => set({ jobs })
}))
