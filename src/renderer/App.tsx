import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import TitleBar from './components/shared/TitleBar'
import PlayerPage from './routes/PlayerPage'
import LibraryPage from './routes/LibraryPage'
import TranscodePage from './routes/TranscodePage'
import SettingsPage from './routes/SettingsPage'
import Sidebar from './components/shared/Sidebar'
import { useSettingsStore } from './stores/settingsStore'
import { useInitializePlayback } from './hooks/usePlayback'
import { useInitializeLibrary } from './hooks/useMediaLibrary'
import { useInitializeTranscode } from './hooks/useTranscode'

export default function App() {
  const loadFromStorage = useSettingsStore((s) => s.loadFromStorage)
  const navigate = useNavigate()
  const location = useLocation()

  useInitializePlayback()
  useInitializeLibrary()
  useInitializeTranscode()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const isPlayerPage = location.pathname === '/'

  return (
    <div className="flex flex-col h-screen w-screen">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {!isPlayerPage && <Sidebar />}
        <main className="flex-1 overflow-hidden bg-surface-dark">
          <Routes>
            <Route path="/" element={<PlayerPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/transcode" element={<TranscodePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
