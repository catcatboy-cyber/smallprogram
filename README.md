# AI股票分析系统 - Render 部署指南

## 快速部署步骤

### 1. 注册 Render 账号
- 访问 https://render.com
- 点击 "Get Started for Free"
- 用 GitHub 账号或邮箱注册

### 2. 创建 Web Service
1. 登录 Render Dashboard
2. 点击 "New" → "Web Service"
3. 选择 "Build and deploy from a Git repository"
4. 连接你的 GitHub 仓库（需要先把代码推送到GitHub）

### 3. 配置环境变量
在 Render Dashboard 的 Environment 中添加：
```
MOONSHOT_API_KEY=你的Kimi API Key
```

### 4. 部署完成
Render 会自动构建并部署，完成后会给你一个 `xxx.onrender.com` 的URL。

## 本地开发

```bash
# 安装依赖
npm install

# 启动后端服务
npm run server

# 启动前端开发服务器（新终端）
npm run dev
```

## 功能特性

- 📊 **真实股票数据** - Yahoo Finance API
- 🤖 **Kimi AI 分析** - 四个AI角色智能分析
- 📈 **技术指标** - MACD, RSI, 均线, 布林带
- 📰 **新闻热点** - 实时财经新闻
- 💡 **投资建议** - 入场价、抛出价、止损价
