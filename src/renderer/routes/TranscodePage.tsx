import { useState } from 'react'
import { useTranscodeStore } from '../stores/transcodeStore'
import { useTranscode } from '../hooks/useTranscode'
import { TranscodeJob, TranscodeProgress } from '../types/media'
import FormatSelector from '../components/transcode/FormatSelector'
import PresetPanel from '../components/transcode/PresetPanel'
import ProgressCard from '../components/transcode/ProgressCard'

const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4 (H.264)', ext: 'mp4' },
  { value: 'mkv', label: 'MKV (H.264)', ext: 'mkv' },
  { value: 'webm', label: 'WebM (VP9)', ext: 'webm' },
  { value: 'avi', label: 'AVI', ext: 'avi' },
  { value: 'mov', label: 'MOV', ext: 'mov' },
  { value: 'mp3', label: 'MP3 (仅音频)', ext: 'mp3', audioOnly: true },
  { value: 'aac', label: 'AAC (仅音频)', ext: 'aac', audioOnly: true },
  { value: 'flac', label: 'FLAC (无损音频)', ext: 'flac', audioOnly: true }
]

export default function TranscodePage() {
  const [inputPath, setInputPath] = useState('')
  const [outputFormat, setOutputFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  const [extractAudio, setExtractAudio] = useState(false)

  const jobs = useTranscodeStore((s) => s.jobs)
  const progressMap = useTranscodeStore((s) => s.progressMap)
  const { start, cancel } = useTranscode()

  const selectInput = async () => {
    if (!window.electronAPI) return
    const files = await window.electronAPI.dialog.openFile()
    if (files.length > 0) {
      setInputPath(files[0])
    }
  }

  const selectOutput = async () => {
    if (!window.electronAPI) return
    const selectedFormat = FORMAT_OPTIONS.find((f) => f.value === outputFormat)
    const ext = selectedFormat?.ext || outputFormat
    const result = await window.electronAPI.dialog.saveFile({
      defaultPath: `output.${ext}`,
      filters: [{ name: '媒体文件', extensions: [ext] }]
    })
    if (result) {
      return result
    }
    return null
  }

  const handleStart = async () => {
    if (!inputPath) return

    const outputPath = await selectOutput()
    if (!outputPath) return

    const job: Omit<TranscodeJob, 'id'> = {
      inputPath,
      outputPath,
      outputFormat,
      videoCodec: quality === 'high' ? 'libx264' : 'libx264',
      audioCodec: 'aac',
      bitrate: quality === 'high' ? 8000 : 2000,
      extractAudio
    }

    const created = await start(job)
    if (created) {
      setInputPath('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-surface">
        <h1 className="text-lg font-semibold text-text-primary mb-1">音视频转码</h1>
        <p className="text-sm text-text-secondary">格式转换、压缩、截取、提取音频，一站式操作</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <label className="block text-sm font-medium text-text-primary mb-2">输入文件</label>
            <div className="flex gap-3">
              <div className="flex-1 bg-surface-dark rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary truncate">
                {inputPath || '未选择文件'}
              </div>
              <button
                onClick={selectInput}
                className="px-4 py-2.5 bg-surface-light hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium transition-colors cursor-pointer border border-border"
              >
                浏览
              </button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <FormatSelector
              value={outputFormat}
              onChange={setOutputFormat}
              options={FORMAT_OPTIONS}
            />
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <PresetPanel
              quality={quality}
              onQualityChange={setQuality}
              extractAudio={extractAudio}
              onExtractAudioChange={setExtractAudio}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!inputPath}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            开始转码
          </button>

          {jobs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">转码任务</h3>
              {jobs.map((job) => (
                <ProgressCard
                  key={job.id}
                  job={job}
                  progress={progressMap[job.id]}
                  onCancel={cancel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
