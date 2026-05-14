# 贡献指南

感谢你对极影全能影音盒的兴趣！欢迎各种形式的贡献。

## 📋 贡献方式

1. **报告 Bug**: 通过 Issue 报告软件问题
2. **功能请求**: 提出新功能想法
3. **代码贡献**: 提交 Pull Request 修复 Bug 或实现功能
4. **文档改进**: 完善 README 或添加使用文档

## 🛠️ 开发环境

### 前置要求

- Node.js >= 20.x
- npm >= 10.x
- Git

### 设置步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/cross-media-box.git
cd cross-media-box

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

## ✅ 代码规范

### 代码风格

- 使用 TypeScript 编写所有代码
- 使用 ESLint 检查代码质量
- 使用 Prettier 自动格式化代码

### 提交信息规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Type 类型**:
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复 Bug）
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**:
```
feat(player): 添加进度条拖动功能
fix(protocol): 修复 Range 请求处理问题
docs(readme): 更新快速开始指南
```

## 📝 Pull Request 流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/awesome-feature`)
3. 提交更改 (`git commit -m 'feat: 添加功能'`)
4. 推送到分支 (`git push origin feature/awesome-feature`)
5. 创建 Pull Request

### PR 要求

- 代码必须通过 `npm run lint` 检查
- 代码必须通过 `npm run typecheck` 类型检查
- 提交信息必须符合 Conventional Commits 规范
- 提供清晰的 PR 描述，说明变更内容和原因

## 🐛 报告 Bug

在提交 Bug 报告前，请先检查是否已有类似 Issue。

报告时请包含：
- **环境信息**: 操作系统版本、Node.js 版本、应用版本
- **复现步骤**: 详细描述如何复现问题
- **预期行为**: 期望发生的结果
- **实际行为**: 实际发生的结果
- **截图/日志**: 如果适用，请提供截图或错误日志

## 💡 功能请求

欢迎提出新功能建议！请在 Issue 中描述：
- 功能的用途和价值
- 使用场景
- 预期的交互方式

## 📄 许可证

提交的代码将遵循项目的 MIT 许可证。

---

再次感谢你的贡献！🎉