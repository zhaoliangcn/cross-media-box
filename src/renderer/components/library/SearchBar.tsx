interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索媒体文件..."
        className="w-full bg-surface-dark text-text-primary text-sm rounded-lg pl-10 pr-4 py-2 border border-border outline-none focus:border-accent transition-colors"
      />
    </div>
  )
}
