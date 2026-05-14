# 变更日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增

- 进度条拖动功能
- 快进/快退按钮（10秒、30秒）
- 键盘快捷键支持
- 播放列表管理

### 修复

- 修复 Range 请求处理问题，支持视频 seek
- 修复协议处理器不支持部分字节请求的问题

### 改进

- 优化视频加载性能
- 改进播放状态管理
- 添加调试日志

## [1.0.0] - 2024-05-14

### 新增

- 初始版本发布
- 支持主流视频格式（MP4、MKV、AVI、MOV、WMV、FLV、WebM）
- 支持主流音频格式（MP3、FLAC、WAV、M4A、OGG）
- 基本播放控制（播放、暂停、停止）
- 音量控制和静音
- 播放速度调节
- 深色主题界面
- 播放列表功能
- 媒体库管理
- 转码功能

### 技术栈

- Electron 28
- React 18
- TypeScript
- Vite
- TailwindCSS 3
- Zustand