import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: '播放器', icon: 'play' },
  { path: '/library', label: '媒体库', icon: 'library' },
  { path: '/transcode', label: '转码', icon: 'transcode' },
  { path: '/settings', label: '设置', icon: 'settings' }
]

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? 'text-accent' : 'text-text-secondary'
  switch (type) {
    case 'play':
      return (
        <svg className={color} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      )
    case 'library':
      return (
        <svg className={color} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      )
    case 'transcode':
      return (
        <svg className={color} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
      )
    case 'settings':
      return (
        <svg className={color} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      )
    default:
      return null
  }
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <NavIcon type={item.icon} active={active} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="text-xs text-text-muted text-center">
          极影全能影音盒 v1.0.0
        </div>
      </div>
    </aside>
  )
}
