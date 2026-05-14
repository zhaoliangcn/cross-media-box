import { useState, useCallback } from 'react'

interface FileDropZoneProps {
  onFileOpen: () => void
  onPathsDropped: (paths: string[]) => void
}

export default function FileDropZone({ onFileOpen, onPathsDropped }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    const paths: string[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i] as File & { path?: string }
      const p = f.path || f.name
      if (p) paths.push(p)
    }
    if (paths.length > 0) {
      onPathsDropped(paths)
    }
  }, [onPathsDropped])

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center transition-colors ${
        isDragOver ? 'bg-accent/10' : 'bg-black'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-24 h-24 rounded-3xl bg-surface-light flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <polyline points="8 13 12 17 16 13"/>
          <line x1="12" y1="17" x2="12" y2="9"/>
        </svg>
      </div>
      <h2 className="text-xl font-medium text-text-primary mb-2">打开媒体文件</h2>
      <p className="text-sm text-text-secondary mb-8">拖放单个或多个文件到此处，或点击下方按钮选择文件</p>
      <button
        onClick={onFileOpen}
        className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        选择文件
      </button>
      <p className="text-xs text-text-muted mt-6">
        支持 MP4, MKV, AVI, MOV, FLV, WebM, MP3, FLAC, WAV 等格式
      </p>
    </div>
  )
}
