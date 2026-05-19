import { BrowserWindow, protocol, net } from 'electron'
import { join } from 'path'
import { open, stat } from 'fs/promises'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-file',
    privileges: {
      bypassCSP: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wma': 'audio/x-ms-wma'
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return MIME_TYPES[`.${ext}`] || 'application/octet-stream'
}

export function registerLocalFileProtocol(): void {
  protocol.handle('local-file', async (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    const rangeHeader = request.headers.get('range')
    console.log(`[local-file] ${request.method} ${filePath} range=${rangeHeader || 'none'}`)

    try {
      const fileStat = await stat(filePath)
      const fileSize = fileStat.size
      const mimeType = getMimeType(filePath)

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (match) {
          const start = parseInt(match[1], 10)
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
          const length = end - start + 1

          if (start >= fileSize || end >= fileSize || start > end) {
            console.log(`[local-file] 416 Range Not Satisfiable (start=${start} end=${end} size=${fileSize})`)
            return new Response(null, {
              status: 416,
              headers: { 'Content-Range': `bytes */${fileSize}` }
            })
          }

          console.log(`[local-file] 206 Partial Content bytes=${start}-${end}/${fileSize} (${length} bytes)`)
          const buffer = Buffer.alloc(length)
          const fd = await open(filePath, 'r')
          try {
            await fd.read(buffer, 0, length, start)
          } finally {
            await fd.close()
          }

          return new Response(buffer, {
            status: 206,
            headers: {
              'Content-Type': mimeType,
              'Content-Length': String(length),
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes'
            }
          })
        }
      }

      console.log(`[local-file] 200 OK (full file, delegating to net.fetch)`)
      const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`
      return net.fetch(fileUrl)
    } catch (err) {
      console.error(`[local-file] ERROR:`, err)
      return new Response('File not found', { status: 404 })
    }
  })
}

class WindowManager {
  private mainWindow: BrowserWindow | null = null

  createMainWindow(): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0a0a0a',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false
      },
      icon: join(__dirname, '../../resources/icon.ico'),
      show: false
    })

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    return this.mainWindow
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  minimize(): void {
    this.mainWindow?.minimize()
  }

  maximize(): void {
    if (this.mainWindow?.isMaximized()) {
      this.mainWindow.unmaximize()
    } else {
      this.mainWindow?.maximize()
    }
  }

  close(): void {
    this.mainWindow?.close()
  }
}

export const windowManager = new WindowManager()
