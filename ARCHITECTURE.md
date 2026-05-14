# 极影全能影音盒 — 架构设计文档

## 1. 文档概述

本文档定义「极影全能影音盒」的总体技术架构、模块划分、数据流设计、目录结构及关键技术决策，作为后续详细设计和编码实现的依据。

---

## 2. 技术选型

### 2.1 运行时与框架

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 桌面壳 | **Electron 28+** | 跨平台潜力（首期 Windows）、成熟生态、Chromium 内核自带高效渲染 |
| UI 框架 | **React 18 + TypeScript** | 组件化开发效率高、生态丰富、类型安全 |
| 构建工具 | **electron-vite** | 统一主进程/预加载/渲染进程构建，HMR 支持 |
| 状态管理 | **Zustand** | 轻量、无模板代码、支持订阅切片避免不必要渲染 |
| 样式方案 | **Tailwind CSS + CSS Modules** | 原子化快速布局 + 组件级样式隔离 |
| 组件库 | **Radix UI + 自定义** | 无样式侵入、可访问性内置、便于主题定制 |

### 2.2 播放与媒体处理

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 播放内核 | **libmpv** | 开源最强播放内核，格式覆盖全、硬件解码优秀、低资源占用 |
| 渲染桥接 | **mpv.js**（自定义 Node 绑定） | 将 libmpv 视频帧渲染至 Electron 窗口 |
| 转码引擎 | **FFmpeg 6.x**（预编译二进制） | 业界标准，全格式支持，命令行/API 双模式 |
| 音频处理 | **Web Audio API + FFmpeg** | 均衡器、滤镜实时处理；FFmpeg 负责离线处理 |

### 2.3 数据与存储

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 本地数据库 | **better-sqlite3** | 同步 API、零配置、嵌入式、性能优异 |
| 文件索引 | **文件系统遍历 + 元数据解析** | 基于 ffprobe 提取媒体元信息 |
| 配置存储 | **electron-store** | 加密持久化用户偏好、窗口状态 |

### 2.4 网络

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 局域网共享 | **http-server (内置) + mDNS** | 轻量 HTTP 流媒体服务 + Bonjour 服务发现 |
| 远程控制 | **WebSocket** | 双向低延迟通信 |

---

## 3. 系统架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                     Renderer Process (渲染进程)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ 播放器页  │ │ 媒体库页  │ │ 转码页   │ │ 设置/歌单/插件页  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       └─────────────┴────────────┴───────────────┘              │
│                         │ React Router                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Zustand Store (状态层)                   │   │
│  │  playerStore │ libraryStore │ transcodeStore │ settingsStore│   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                        │
│              contextBridge (preload 安全桥接)                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │  IPC (ipcRenderer ↔ ipcMain)
┌─────────────────────────┴───────────────────────────────────────┐
│                     Main Process (主进程)                         │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐               │
│  │ PlaybackSvc │ │ TranscodeSvc │ │ LibrarySvc  │               │
│  │ (libmpv)    │ │ (FFmpeg)     │ │ (ffprobe)   │               │
│  └──────┬──────┘ └──────┬───────┘ └──────┬──────┘               │
│         │               │                │                       │
│  ┌──────┴───────────────┴────────────────┴──────┐               │
│  │              Service Registry                  │               │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │               │
│  │  │ Network  │ │ Plugin   │ │ Update/      │  │               │
│  │  │ Service  │ │ Manager  │ │ License Svc  │  │               │
│  │  └──────────┘ └──────────┘ └──────────────┘  │               │
│  └──────────────────────────────────────────────┘               │
│                         │                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Data Access Layer                       │   │
│  │  SQLite (better-sqlite3)  │  electron-store  │  FS API    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 进程模型

| 进程 | 职责 | 沙箱 |
|------|------|------|
| **主进程 (Main)** | 窗口管理、原生服务（播放/转码/文件 IO）、IPC 路由 | 否 |
| **渲染进程 (Renderer)** | UI 渲染、用户交互、轻量状态管理 | 是（禁用 Node） |
| **预加载脚本 (Preload)** | contextBridge 暴露有限 API 给渲染进程 | 是 |
| **GPU 进程** | 视频硬件解码、Canvas/WebGL 渲染 | Chromium 内置 |

---

## 4. 模块详细设计

### 4.1 播放器模块 (Player Module)

**核心职责**：视频/音频解码渲染、播放控制、字幕管理、音轨切换。

```
PlayerModule
├── PlaybackCore          # libmpv 封装，生命周期管理
│   ├── MpvInstance       # mpv 实例创建/销毁
│   ├── RenderBridge      # 视频帧 → Canvas/Offscreen
│   └── HWAccel           # DXVA2/D3D11VA 硬件加速
├── PlaybackController    # 播放/暂停/Seek/AB循环
├── SubtitleManager       # 字幕自动匹配、加载、样式调整
├── AudioTrackManager     # 多音轨切换、音频流选择
├── VideoFilterPipeline   # 亮度/对比度/饱和度/锐化
└── PlaybackHistory       # 记忆播放进度（断点续播）
```

**关键流程**：
1. 用户打开文件 → IPC 通知主进程
2. 主进程创建 MpvInstance，加载文件
3. libmpv 解码 → 视频帧回调 → 通过共享纹理写入渲染进程 Canvas
4. 用户操作（暂停/Seek）→ IPC → PlaybackController → libmpv API

### 4.2 转码模块 (Transcode Module)

**核心职责**：格式转换、视频压缩、片段截取、画面裁剪、音频提取。

```
TranscodeModule
├── TranscodePipeline     # FFmpeg 命令行构建与执行
├── PresetManager         # 预设模板（H.264/H.265/WebM 等）
├── ProgressTracker       # 转码进度计算与上报
├── ClipEditor            # 片段截取（入点/出点选择）
├── CropFilter            # 画面裁剪区域配置
└── AudioExtractor        # 提取音频为 MP3/AAC/FLAC
```

**关键流程**：
1. 用户在渲染进程配置转码参数
2. 参数通过 IPC 提交至 TranscodeService
3. 主进程构建 FFmpeg 命令，spawn 子进程执行
4. FFmpeg stderr 解析进度 → IPC 推送 → UI 进度条更新
5. 完成后通知渲染进程，输出文件路径

### 4.3 媒体库模块 (Library Module)

**核心职责**：本地文件扫描、元数据提取、歌单管理、封面获取。

```
LibraryModule
├── FileScanner           # 递归扫描指定目录，过滤媒体文件
├── MetadataExtractor     # ffprobe 提取分辨率/码率/时长/编码
├── CoverArtResolver      # 内嵌封面提取 + 网络封面匹配
├── PlaylistManager       # 歌单 CRUD、排序、导入导出
└── SearchIndexer         # 全文搜索索引（文件名/标题/艺术家）
```

### 4.4 增强模块 (Enhancement Module)

**核心职责**：倍速播放、画面滤镜、音效均衡器、画面置顶。

```
EnhancementModule
├── SpeedController       # 0.25x ~ 4x 倍速，变速不变调
├── EqualizerEngine       # 10段均衡器 + 预设（摇滚/流行/古典/人声）
├── PictureInPicture      # 画面置顶小窗模式
└── VisualFilterPreset    # 滤镜预设（怀旧/黑白/鲜艳/电影）
```

### 4.5 网络模块 (Network Module)

**核心职责**：局域网共享播放、远程控制。

```
NetworkModule
├── LANStreamingServer    # 内置 HTTP 流媒体服务
├── ServiceDiscovery      # mDNS/Bonjour 设备发现
├── RemoteControl         # WebSocket 远程控制（手机当遥控器）
└── DLNA/UPnP             # 投屏到电视/投影仪
```

### 4.6 插件模块 (Plugin Module)

**核心职责**：主题皮肤管理、音效插件加载、扩展能力。

```
PluginModule
├── ThemeManager          # 皮肤加载/切换/预览
├── AudioPluginLoader     # VST/自定义音效插件加载
├── PluginMarket          # 插件商店（付费内容）
└── PluginSandbox         # 插件安全隔离执行
```

---

## 5. 数据流设计

### 5.1 播放数据流

```
用户点击播放
    │
    ▼
Renderer: 发送 IPC "playback:open" { filePath }
    │
    ▼
Main: PlaybackService.open(filePath)
    │
    ├──► ffprobe 提取元数据 → 存入 LibraryDB
    │
    └──► libmpv 加载文件 → 开始解码
              │
              ▼
         mpv 视频帧回调
              │
              ▼
         RenderBridge 写入共享纹理
              │
              ▼
         IPC "playback:frame-ready" → Renderer Canvas 渲染
              │
              ▼
         用户操作 (pause/seek/volume)
              │
              ▼
         IPC "playback:control" { action, value }
              │
              ▼
         Main: PlaybackController 执行 → libmpv API
```

### 5.2 转码数据流

```
用户配置转码参数 → 点击开始
    │
    ▼
Renderer: IPC "transcode:start" { inputPath, outputFormat, options }
    │
    ▼
Main: TranscodeService.start(job)
    │
    ├──► 构建 FFmpeg 命令行
    │
    └──► child_process.spawn("ffmpeg", args)
              │
              ▼
         stderr 流解析 (frame=xxx, time=xxx)
              │
              ▼
         IPC "transcode:progress" { percent, eta }
              │
              ▼
         Renderer: 进度条更新
              │
              ▼
         完成 → IPC "transcode:complete" { outputPath }
```

### 5.3 媒体库扫描数据流

```
用户添加扫描目录
    │
    ▼
Renderer: IPC "library:scan" { directories }
    │
    ▼
Main: LibraryService.scan(directories)
    │
    ├──► 递归遍历文件系统
    │
    ├──► 过滤媒体文件（扩展名白名单）
    │
    ├──► 批量 ffprobe 提取元数据
    │
    ├──► 写入 SQLite LibraryDB
    │
    └──► IPC "library:scan-progress" { current, total }
              │
              ▼
         IPC "library:scan-complete" { totalFiles }
              │
              ▼
         Renderer: 刷新媒体库视图
```

---

## 6. 目录结构

```
cross-media-box/
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
│
├── resources/                        # 静态资源（打包时复制）
│   ├── icon.ico
│   ├── ffmpeg/                       # 预编译 FFmpeg 二进制
│   │   ├── win32-x64/
│   │   │   ├── ffmpeg.exe
│   │   │   └── ffprobe.exe
│   │   └── ...
│   └── mpv/                          # libmpv 动态库
│       └── win32-x64/
│           └── mpv-2.dll
│
├── src/
│   ├── main/                         # 主进程代码
│   │   ├── index.ts                  # 入口：窗口创建、服务初始化
│   │   ├── window/
│   │   │   └── WindowManager.ts      # 窗口生命周期管理
│   │   ├── services/
│   │   │   ├── PlaybackService.ts    # 播放服务（libmpv 封装）
│   │   │   ├── TranscodeService.ts   # 转码服务（FFmpeg 封装）
│   │   │   ├── LibraryService.ts     # 媒体库服务
│   │   │   ├── NetworkService.ts     # 局域网共享服务
│   │   │   └── PluginService.ts      # 插件管理服务
│   │   ├── ipc/
│   │   │   ├── index.ts              # IPC 路由注册
│   │   │   ├── playback.ipc.ts       # 播放相关 IPC handler
│   │   │   ├── transcode.ipc.ts      # 转码相关 IPC handler
│   │   │   ├── library.ipc.ts        # 媒体库相关 IPC handler
│   │   │   ├── settings.ipc.ts       # 设置相关 IPC handler
│   │   │   └── plugin.ipc.ts         # 插件相关 IPC handler
│   │   ├── db/
│   │   │   ├── database.ts           # SQLite 连接管理
│   │   │   ├── migrations/           # 数据库迁移脚本
│   │   │   └── repositories/         # 数据仓库层
│   │   │       ├── MediaRepository.ts
│   │   │       ├── PlaylistRepository.ts
│   │   │       └── HistoryRepository.ts
│   │   └── utils/
│   │       ├── ffprobe.ts            # ffprobe 元数据提取工具
│   │       ├── fileScanner.ts        # 文件系统扫描工具
│   │       └── logger.ts             # 日志工具
│   │
│   ├── preload/                      # 预加载脚本
│   │   ├── index.ts                  # contextBridge 暴露 API
│   │   └── types.ts                  # 暴露 API 的类型定义
│   │
│   └── renderer/                     # 渲染进程代码
│       ├── index.html
│       ├── main.tsx                  # React 入口
│       ├── App.tsx                   # 根组件 + 路由
│       ├── routes/
│       │   ├── PlayerPage.tsx        # 播放器页面
│       │   ├── LibraryPage.tsx       # 媒体库页面
│       │   ├── TranscodePage.tsx     # 转码页面
│       │   └── SettingsPage.tsx      # 设置页面
│       ├── components/
│       │   ├── player/
│       │   │   ├── VideoCanvas.tsx   # 视频渲染画布
│       │   │   ├── ControlBar.tsx    # 播放控制栏
│       │   │   ├── SeekBar.tsx       # 进度条
│       │   │   ├── VolumeSlider.tsx  # 音量滑块
│       │   │   ├── SubtitleOverlay.tsx # 字幕叠加层
│       │   │   └── PlaylistPanel.tsx # 播放列表侧栏
│       │   ├── library/
│       │   │   ├── MediaGrid.tsx     # 媒体网格视图
│       │   │   ├── MediaList.tsx     # 媒体列表视图
│       │   │   ├── PlaylistTree.tsx  # 歌单树形结构
│       │   │   └── SearchBar.tsx     # 搜索栏
│       │   ├── transcode/
│       │   │   ├── FormatSelector.tsx # 格式选择器
│       │   │   ├── PresetPanel.tsx   # 预设面板
│       │   │   ├── ClipEditor.tsx    # 片段编辑器
│       │   │   └── ProgressCard.tsx  # 转码进度卡片
│       │   ├── settings/
│       │   │   ├── GeneralSettings.tsx
│       │   │   ├── HotkeySettings.tsx
│       │   │   ├── ThemeSettings.tsx
│       │   │   └── PluginSettings.tsx
│       │   └── shared/
│       │       ├── TitleBar.tsx       # 自定义标题栏
│       │       ├── ContextMenu.tsx    # 右键菜单
│       │       ├── FileDropZone.tsx   # 文件拖放区域
│       │       └── Toast.tsx          # 通知提示
│       ├── stores/
│       │   ├── playerStore.ts        # 播放状态
│       │   ├── libraryStore.ts       # 媒体库状态
│       │   ├── transcodeStore.ts     # 转码状态
│       │   └── settingsStore.ts      # 设置状态
│       ├── hooks/
│       │   ├── usePlayback.ts        # 播放控制 Hook
│       │   ├── useMediaLibrary.ts    # 媒体库 Hook
│       │   ├── useTranscode.ts       # 转码 Hook
│       │   └── useHotkey.ts          # 快捷键 Hook
│       ├── styles/
│       │   ├── globals.css           # 全局样式 + Tailwind
│       │   ├── themes/               # 主题变量
│       │   │   ├── default.css
│       │   │   └── dark.css
│       │   └── components/           # 组件级 CSS Modules
│       └── types/
│           ├── media.ts              # 媒体相关类型
│           ├── player.ts             # 播放器类型
│           ├── transcode.ts          # 转码类型
│           └── ipc.ts                # IPC 通道类型
│
├── plugins/                          # 插件目录（用户安装）
│   ├── themes/
│   │   └── example-theme/
│   └── audio-plugins/
│       └── example-plugin/
│
└── tests/
    ├── unit/
    │   ├── services/
    │   └── stores/
    └── e2e/
        └── playback.spec.ts
```

---

## 7. IPC 通信设计

### 7.1 通道命名规范

```
{domain}:{action}
```

| 域 | 通道示例 | 方向 |
|----|---------|------|
| playback | `playback:open`, `playback:control`, `playback:frame-ready` | 双向 |
| transcode | `transcode:start`, `transcode:cancel`, `transcode:progress` | 双向 |
| library | `library:scan`, `library:get-media`, `library:create-playlist` | 双向 |
| settings | `settings:get`, `settings:set`, `settings:reset` | 双向 |
| plugin | `plugin:list`, `plugin:install`, `plugin:activate` | 双向 |
| window | `window:minimize`, `window:maximize`, `window:close` | Renderer→Main |
| dialog | `dialog:open-file`, `dialog:save-file` | Renderer→Main |
| system | `system:notification`, `system:tray-update` | Main→Renderer |

### 7.2 预加载暴露 API 设计

```typescript
// src/preload/types.ts
interface ElectronAPI {
  // 播放
  playback: {
    open(filePath: string): Promise<MediaMetadata>;
    control(action: PlaybackAction, value?: number): void;
    onFrameReady(callback: (frame: ArrayBuffer) => void): () => void;
    onPlaybackStateChange(callback: (state: PlaybackState) => void): () => void;
  };
  // 转码
  transcode: {
    start(job: TranscodeJob): Promise<string>;
    cancel(jobId: string): void;
    onProgress(callback: (progress: TranscodeProgress) => void): () => void;
  };
  // 媒体库
  library: {
    scan(directories: string[]): Promise<ScanResult>;
    getMediaList(filter: MediaFilter): Promise<MediaItem[]>;
    createPlaylist(name: string): Promise<Playlist>;
  };
  // 设置
  settings: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  };
  // 窗口
  window: {
    minimize(): void;
    maximize(): void;
    close(): void;
  };
  // 对话框
  dialog: {
    openFile(options: OpenDialogOptions): Promise<string[]>;
    saveFile(options: SaveDialogOptions): Promise<string>;
  };
}

// contextBridge 暴露
contextBridge.exposeInMainWorld('electronAPI', api);
```

---

## 8. 数据库设计

### 8.1 ER 图（核心表）

```
┌──────────────┐       ┌──────────────────┐
│   media      │       │   playlist       │
├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)          │
│ file_path    │       │ name             │
│ file_name    │       │ description      │
│ file_size    │       │ cover_path       │
│ duration     │       │ created_at       │
│ format       │       │ updated_at       │
│ resolution   │       └────────┬─────────┘
│ bitrate      │                │
│ codec        │       ┌────────┴─────────┐
│ audio_codec  │       │ playlist_media   │
│ audio_channels│      ├──────────────────┤
│ has_subtitle │       │ playlist_id (FK) │
│ cover_path   │       │ media_id (FK)    │
│ created_at   │       │ sort_order       │
│ updated_at   │       │ added_at         │
└──────┬───────┘       └──────────────────┘
       │
┌──────┴───────────┐
│  play_history    │
├──────────────────┤
│ id (PK)          │
│ media_id (FK)    │
│ last_position    │
│ play_count       │
│ last_played_at   │
└──────────────────┘
```

### 8.2 建表 SQL

```sql
CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  duration REAL,
  format TEXT,
  resolution TEXT,
  bitrate INTEGER,
  codec TEXT,
  audio_codec TEXT,
  audio_channels INTEGER,
  has_subtitle INTEGER DEFAULT 0,
  cover_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE playlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE playlist_media (
  playlist_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (playlist_id, media_id),
  FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
);

CREATE TABLE play_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL UNIQUE,
  last_position REAL DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  last_played_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
);

CREATE INDEX idx_media_format ON media(format);
CREATE INDEX idx_media_name ON media(file_name);
CREATE INDEX idx_history_media ON play_history(media_id);
```

---

## 9. 插件系统设计

### 9.1 主题插件规范

```json
// theme/package.json
{
  "name": "example-theme",
  "version": "1.0.0",
  "type": "theme",
  "author": "...",
  "description": "...",
  "main": "theme.css"
}
```

主题插件只需提供 CSS 变量覆盖文件：

```css
/* theme.css */
:root {
  --color-primary: #ff6b35;
  --color-bg-main: #1a1a2e;
  --color-bg-card: #16213e;
  --color-text: #e0e0e0;
  --radius-default: 8px;
  --font-family: "Microsoft YaHei", sans-serif;
}
```

### 9.2 音效插件规范

```json
// audio-plugin/package.json
{
  "name": "example-audio-plugin",
  "version": "1.0.0",
  "type": "audio-plugin",
  "author": "...",
  "description": "...",
  "main": "plugin.js"
}
```

插件通过标准接口注入音频处理管线：

```typescript
interface AudioPlugin {
  name: string;
  version: string;
  // 处理音频缓冲区
  process(input: Float32Array[], sampleRate: number): Float32Array[];
  // 提供 UI 控制面板
  renderControlPanel(container: HTMLElement): void;
  // 销毁
  destroy(): void;
}
```

---

## 10. 关键技术决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 视频渲染方式 | 共享纹理（Offscreen → Canvas） | 避免 IPC 传输帧数据，零拷贝 |
| 硬件加速 | DXVA2/D3D11VA 自动检测 | Windows 平台最优硬解方案 |
| 转码并发 | 单任务队列，串行执行 | FFmpeg 本身多线程，避免 CPU 争抢 |
| 媒体库扫描 | 增量扫描 + 文件哈希去重 | 避免重复扫描，大库性能友好 |
| 字幕匹配 | 文件名模糊匹配 + opensubtitles 可选 | 本地优先，网络备选 |
| 自动更新 | electron-updater + 增量更新 | 减少下载体积 |
| 崩溃上报 | Sentry（可选关闭） | 用户隐私可控 |

---

## 11. 性能指标

| 指标 | 目标 |
|------|------|
| 冷启动时间 | < 2 秒 |
| 4K 视频播放 CPU 占用 | < 15%（硬解） |
| 媒体库扫描速度 | > 500 文件/秒 |
| 转码进度反馈延迟 | < 500ms |
| 内存占用（空闲） | < 150MB |
| 内存占用（播放 4K） | < 400MB |

---

## 12. 安全设计

- **渲染进程沙箱**：`sandbox: true`，禁用 Node.js 集成
- **contextIsolation**：强制开启，渲染进程无法直接访问主进程 API
- **CSP 策略**：严格限制脚本来源
- **文件访问**：仅允许用户明确选择的目录
- **插件隔离**：插件在独立 context 中执行，限制文件系统访问
- **网络请求白名单**：仅允许字幕匹配、封面获取等必要请求

---

> 文档版本：v1.0 | 最后更新：2026-05-07
