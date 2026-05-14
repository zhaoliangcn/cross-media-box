interface PresetPanelProps {
  quality: string
  onQualityChange: (quality: string) => void
  extractAudio: boolean
  onExtractAudioChange: (extract: boolean) => void
}

const qualityOptions = [
  { value: 'high', label: '高质量', desc: '码率 8Mbps' },
  { value: 'medium', label: '中等', desc: '码率 4Mbps' },
  { value: 'low', label: '低质量', desc: '码率 2Mbps' }
]

export default function PresetPanel({
  quality,
  onQualityChange,
  extractAudio,
  onExtractAudioChange
}: PresetPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">画质预设</label>
        <div className="flex gap-2">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onQualityChange(option.value)}
              className={`flex-1 px-3 py-2.5 rounded-lg text-xs text-center transition-all border cursor-pointer ${
                quality === option.value
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface-dark border-border text-text-secondary hover:border-accent/50'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => onExtractAudioChange(!extractAudio)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              extractAudio ? 'bg-accent' : 'bg-surface-light'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                extractAudio ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-sm text-text-primary">仅提取音频（不包含视频）</span>
        </label>
      </div>
    </div>
  )
}
