import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerAllIpcHandlers } from './ipc'
import { initDatabase } from './db/database'
import { windowManager, registerLocalFileProtocol } from './window/WindowManager'

function createWindow(): BrowserWindow {
  const win = windowManager.createMainWindow()

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  registerLocalFileProtocol()
  await initDatabase()
  registerAllIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
