# 极影全能影音盒 (Cross Media Box)

一款纯净无广告的本地影音全能播放器，基于 Electron + React + TypeScript 构建。

## ✨ 功能特点

- 🎬 **全格式支持**: 支持 MP4、MKV、AVI、MOV、WMV、FLV、WebM 等主流视频格式
- 🎵 **音频播放**: 完美支持 MP3、FLAC、WAV、M4A、OGG 等音频格式
- ⏯️ **完整播放控制**: 播放/暂停、快进/快退、进度条拖动
- 📋 **播放列表**: 支持多文件播放队列，自动切换下一首
- ⚡ **性能优化**: 基于原生视频解码，流畅播放高清视频
- 🎨 **精美界面**: 现代化深色主题设计
- 📱 **响应式布局**: 自适应窗口大小

## 🚀 快速开始

### 前置要求

- Node.js >= 20.x
- npm >= 10.x

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 打包发布

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## 🛠️ 技术栈

- **框架**: Electron 28
- **前端**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS 3
- **图标**: Lucide React
- **状态管理**: Zustand

## 📁 项目结构

```
cross-media-box/
├── src/
│   ├── main/          # 主进程代码
│   │   ├── ipc/       # IPC 通信处理
│   │   ├── services/  # 服务层
│   │   ├── window/    # 窗口管理
│   │   └── db/        # 数据库操作
│   ├── renderer/      # 渲染进程代码
│   │   ├── components/# React 组件
│   │   ├── hooks/     # 自定义 Hooks
│   │   ├── stores/    # 状态管理
│   │   └── routes/    # 页面路由
│   └── preload/       # Preload 脚本
├── build.ps1          # Windows 构建脚本
├── build.sh           # Linux/macOS 构建脚本
└── package.json
```

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！详见 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📧 联系方式

如有问题或建议，欢迎通过 Issue 反馈。