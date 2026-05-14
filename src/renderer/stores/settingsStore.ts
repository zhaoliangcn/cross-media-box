import { create } from 'zustand'

interface SettingsStore {
  theme: 'dark' | 'light'
  volume: number
  muted: boolean
  autoPlayNext: boolean
  rememberProgress: boolean
  hardwareAccel: boolean
  defaultPlaybackSpeed: number
  language: string
  setTheme: (theme: 'dark' | 'light') => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setAutoPlayNext: (auto: boolean) => void
  setRememberProgress: (remember: boolean) => void
  setHardwareAccel: (accel: boolean) => void
  setDefaultPlaybackSpeed: (speed: number) => void
  setLanguage: (lang: string) => void
  loadFromStorage: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  volume: 1,
  muted: false,
  autoPlayNext: true,
  rememberProgress: true,
  hardwareAccel: true,
  defaultPlaybackSpeed: 1,
  language: 'zh-CN',
  setTheme: (theme) => set({ theme }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ muted }),
  setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
  setRememberProgress: (rememberProgress) => set({ rememberProgress }),
  setHardwareAccel: (hardwareAccel) => set({ hardwareAccel }),
  setDefaultPlaybackSpeed: (defaultPlaybackSpeed) => set({ defaultPlaybackSpeed }),
  setLanguage: (language) => set({ language }),
  loadFromStorage: async () => {
    if (!window.electronAPI) return
    const settings = await window.electronAPI.settings.getAll()
    if (settings && typeof settings === 'object') {
      const s = settings as Record<string, unknown>
      set({
        theme: (s.theme as 'dark' | 'light') || 'dark',
        volume: (s.volume as number) ?? 1,
        muted: (s.muted as boolean) ?? false,
        autoPlayNext: (s.autoPlayNext as boolean) ?? true,
        rememberProgress: (s.rememberProgress as boolean) ?? true,
        hardwareAccel: (s.hardwareAccel as boolean) ?? true,
        defaultPlaybackSpeed: (s.defaultPlaybackSpeed as number) ?? 1,
        language: (s.language as string) ?? 'zh-CN'
      })
    }
  }
}))
