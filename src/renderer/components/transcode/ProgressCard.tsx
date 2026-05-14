import { TranscodeJob, TranscodeProgress } from '../../types/media'

interface ProgressCardProps {
  job: TranscodeJob
  progress?: TranscodeProgress
  onCancel: (jobId: string) => void
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return '等待中'
    case 'running': return '转码中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'cancelled': return '已取消'
    default: return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-success'
    case 'failed': return 'text-danger'
    case 'cancelled': return 'text-warning'
    case 'running': return 'text-accent'
    default: return 'text-text-muted'
  }
}

export default function ProgressCard({ job, progress, onCancel }: ProgressCardProps) {
  const p = progress
  const isRunning = p?.status === 'running'
  const isDone = p?.status === 'completed' || p?.status === 'failed' || p?.status === 'cancelled'

  const fileName = job.inputPath.replace(/\\/g, '/').split('/').pop() || job.inputPath

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text-primary truncate">{fileName}</p>
            <p className="text-xs text-text-muted">→ {job.outputFormat.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {p && (
            <span className={`text-xs font-medium ${getStatusColor(p.status)}`}>
              {getStatusLabel(p.status)}
            </span>
          )}
          {isRunning && (
            <button
              onClick={() => onCancel(job.id)}
              className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer"
            >
              取消
            </button>
          )}
        </div>
      </div>

      {p && (
        <div className="space-y-1.5">
          <div className="w-full h-1.5 bg-surface-dark rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                p.status === 'completed' ? 'bg-success' :
                p.status === 'failed' ? 'bg-danger' :
                'bg-accent'
              }`}
              style={{ width: `${p.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{p.percent}%</span>
            {p.eta > 0 && <span>预计剩余 {p.eta} 秒</span>}
          </div>
        </div>
      )}
    </div>
  )
}
