import { useSettingsStore } from '../stores/settingsStore'

export default function SettingsPage() {
  const {
    theme, setTheme,
    volume, setVolume,
    autoPlayNext, setAutoPlayNext,
    rememberProgress, setRememberProgress,
    hardwareAccel, setHardwareAccel,
    defaultPlaybackSpeed, setDefaultPlaybackSpeed,
    language, setLanguage
  } = useSettingsStore()

  const saveSetting = (key: string, value: unknown) => {
    window.electronAPI?.settings.set(key, value)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-surface">
        <h1 className="text-lg font-semibold text-text-primary mb-1">设置</h1>
        <p className="text-sm text-text-secondary">自定义播放器行为和外观</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">外观</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">主题模式</p>
                  <p className="text-xs text-text-muted mt-0.5">选择深色或浅色主题</p>
                </div>
                <select
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value as 'dark' | 'light')
                    saveSetting('theme', e.target.value)
                  }}
                  className="bg-surface-dark text-text-primary text-sm rounded-lg px-3 py-2 border border-border outline-none focus:border-accent cursor-pointer"
                >
                  <option value="dark">深色模式</option>
                  <option value="light">浅色模式</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">语言</p>
                  <p className="text-xs text-text-muted mt-0.5">界面显示语言</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value)
                    saveSetting('language', e.target.value)
                  }}
                  className="bg-surface-dark text-text-primary text-sm rounded-lg px-3 py-2 border border-border outline-none focus:border-accent cursor-pointer"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">播放设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">默认音量</p>
                  <p className="text-xs text-text-muted mt-0.5">启动时的默认音量大小</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setVolume(v)
                      saveSetting('volume', v)
                    }}
                    className="w-24 h-1 accent-accent cursor-pointer"
                  />
                  <span className="text-xs text-text-secondary w-8">{Math.round(volume * 100)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">默认播放速度</p>
                  <p className="text-xs text-text-muted mt-0.5">启动时的默认倍速</p>
                </div>
                <select
                  value={defaultPlaybackSpeed}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    setDefaultPlaybackSpeed(v)
                    saveSetting('defaultPlaybackSpeed', v)
                  }}
                  className="bg-surface-dark text-text-primary text-sm rounded-lg px-3 py-2 border border-border outline-none focus:border-accent cursor-pointer"
                >
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((s) => (
                    <option key={s} value={s}>{s}x</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">自动播放下一集</p>
                  <p className="text-xs text-text-muted mt-0.5">播放结束后自动播放列表中的下一个</p>
                </div>
                <button
                  onClick={() => {
                    setAutoPlayNext(!autoPlayNext)
                    saveSetting('autoPlayNext', !autoPlayNext)
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    autoPlayNext ? 'bg-accent' : 'bg-surface-light'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoPlayNext ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">记忆播放进度</p>
                  <p className="text-xs text-text-muted mt-0.5">记住上次观看位置，续播继续观看</p>
                </div>
                <button
                  onClick={() => {
                    setRememberProgress(!rememberProgress)
                    saveSetting('rememberProgress', !rememberProgress)
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    rememberProgress ? 'bg-accent' : 'bg-surface-light'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      rememberProgress ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">性能</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary">硬件加速解码</p>
                <p className="text-xs text-text-muted mt-0.5">使用显卡硬解，降低 CPU 占用</p>
              </div>
              <button
                onClick={() => {
                  setHardwareAccel(!hardwareAccel)
                  saveSetting('hardwareAccel', !hardwareAccel)
                }}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  hardwareAccel ? 'bg-accent' : 'bg-surface-light'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    hardwareAccel ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">关于</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">应用名称</span>
                <span className="text-text-primary">极影全能影音盒</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">版本</span>
                <span className="text-text-primary">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">技术栈</span>
                <span className="text-text-primary">Electron + React + TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">播放内核</span>
                <span className="text-text-primary">libmpv + FFmpeg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
