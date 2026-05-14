import { useNavigate, useLocation } from 'react-router-dom'

export default function TitleBar() {
  const navigate = useNavigate()

  const handleMinimize = () => window.electronAPI?.window.minimize()
  const handleMaximize = () => window.electronAPI?.window.maximize()
  const handleClose = () => window.electronAPI?.window.close()

  return (
    <div className="drag-region flex items-center justify-between h-10 bg-surface px-2 border-b border-border shrink-0">
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-surface-hover transition-colors"
        >
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold">J</span>
          </div>
          <span className="text-sm font-medium text-text-primary">极影全能影音盒</span>
        </button>
      </div>

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1.5" fill="currentColor" rx="0.5"/></svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1"/></svg>
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-danger text-text-secondary hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
    </div>
  )
}
