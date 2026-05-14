import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'

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

export class TranscodeService extends EventEmitter {
  private jobs: Map<string, TranscodeJob> = new Map()
  private queue: string[] = []
  private running = false

  start(job: Omit<TranscodeJob, 'id'>): TranscodeJob {
    const id = uuidv4()
    const fullJob: TranscodeJob = { ...job, id }
    this.jobs.set(id, fullJob)
    this.queue.push(id)
    this.processQueue()
    return fullJob
  }

  cancel(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (job) {
      this.queue = this.queue.filter((id) => id !== jobId)
      this.emitProgress(jobId, 0, 0, 0, 0, 'cancelled')
      this.jobs.delete(jobId)
      this.running = false
      this.processQueue()
    }
  }

  getJob(jobId: string): TranscodeJob | undefined {
    return this.jobs.get(jobId)
  }

  getAllJobs(): TranscodeJob[] {
    return Array.from(this.jobs.values())
  }

  private processQueue(): void {
    if (this.running || this.queue.length === 0) return

    const jobId = this.queue.shift()!
    const job = this.jobs.get(jobId)
    if (!job) return

    this.running = true
    this.emitProgress(jobId, 0, 0, 100, 10, 'running')

    this.simulateTranscode(job)
  }

  private simulateTranscode(job: TranscodeJob): void {
    const totalSteps = 100
    let step = 0
    const totalDuration = 5000

    const interval = setInterval(() => {
      step++
      const percent = Math.round((step / totalSteps) * 100)
      const eta = Math.round((totalDuration * (100 - percent)) / 100)

      if (percent >= 100) {
        clearInterval(interval)
        this.emitProgress(job.id, 100, job.endTime || 120, job.endTime || 120, 0, 'completed')
        this.running = false
        this.jobs.delete(job.id)
        this.processQueue()
      } else {
        this.emitProgress(job.id, percent, step, totalSteps, eta, 'running')
      }
    }, totalDuration / totalSteps)
  }

  private emitProgress(
    jobId: string,
    percent: number,
    currentTime: number,
    totalTime: number,
    eta: number,
    status: TranscodeProgress['status']
  ): void {
    const progress: TranscodeProgress = {
      jobId,
      percent,
      currentTime,
      totalTime,
      eta,
      status
    }
    this.emit('progress', progress)
    logger.info(`Transcode [${jobId}]: ${percent}% - ${status}`)
  }
}

export const transcodeService = new TranscodeService()
