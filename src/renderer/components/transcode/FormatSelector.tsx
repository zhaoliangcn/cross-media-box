interface FormatOption {
  value: string
  label: string
  ext: string
  audioOnly?: boolean
}

interface FormatSelectorProps {
  value: string
  onChange: (value: string) => void
  options: FormatOption[]
}

export default function FormatSelector({ value, onChange, options }: FormatSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-3">输出格式</label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium text-center transition-all border cursor-pointer ${
              value === option.value
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-surface-dark border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }`}
          >
            <div className="font-semibold mb-0.5">{option.ext.toUpperCase()}</div>
            <div className="text-[10px] opacity-70">{option.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
