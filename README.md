# Colin's 三国杀 (Sanguosha PWA)

> 专为 Colin 定制的单机卡牌《三国杀》网页应用 (Progressive Web App)，支持离线畅玩、跨平台安装。

## 特性亮点

- 🃏 **完整卡牌与武将**：标准包、神话再临（风火林山）、军争篇、界限突破、经典锦囊与装备一应俱全。
- 🤖 **单机智能 AI**：内置成熟人机决策引擎，离线身份局（主忠反内）、国战、1v1 随时开局。
- 📱 **原生 PWA 体验**：
  - iPad / iPhone（Safari “添加到主屏幕”）或 Android / PC（Chrome “安装应用”）。
  - 启动后自动横屏全屏运行，无浏览器顶栏和底栏干扰。
- ⚡️ **离线加速与秒开**：通过 Service Worker 与 Cache API 对卡牌、武将、音效全量本地缓存。
- ☁️ **Cloudflare Pages 托管**：全球 CDN 边缘加速，自动化部署。

## 部署说明

本项目为纯静态前端架构，无需复杂编译构建：
- 静态部署目录：根目录 `./`
- 核心配置文件：`manifest.json`, `sw.js`, `_headers`
