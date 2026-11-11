# 🔍 Keyword Planner (Next.js 15 全栈版)

基于 Next.js 15 (App Router) + Tailwind CSS 构建的 Google Ads 官方关键词规划师查询网页。
采用**纯原生 REST Fetch** 实现，完全不依赖 Node 原生 C++ 扩展，**可 100% 无缝部署到 Vercel 或 Cloudflare**。

---

## ✨ 功能亮点

- 🛡️ **内置密码访问控制**：基于 Next.js Edge Middleware + SHA-256 Cookie 验证，防止未授权访问。
- 📊 **精确搜索量**：Google 官方月均精确搜索量、近 12 个月月度趋势 Sparkline 折线图。
- 🎯 **竞争度与 CPC**：竞争度（LOW/MEDIUM/HIGH）、竞争指数（0-100）、页首低位与高位竞价区间。
- 💡 **双模式支持**：精确查词模式 (Historical) + 种子词拓展模式 (Ideas)。
- 🌍 **全球与多语言**：支持 20+ 主流国家/地区及 11 种语言。
- 📋 **数据导出**：支持一键导出 CSV 表格或复制富文本表格粘贴至 Excel。
- ⚡ **无外部依赖**：RESTful 架构，冷启动毫秒级，兼容 Edge Runtime。

---

## 🚀 本地运行

```bash
cd /Users/theboy/projects/seo/keyword-planner

# 启动生产服务 (已在端口 3088 运行中)
npm run start
# 或启动开发热重载
npm run dev
```

浏览器访问：`http://localhost:3088`
- **默认访问密码**：`kp_Seo2024!`（可在 `.env.local` 中修改 `AUTH_PASSWORD`）

---

## ☁️ 部署到 Vercel（推荐，最省心）

1. **推送到 GitHub / GitLab**：
   ```bash
   git init
   git add .
   git commit -m "feat: initial keyword planner"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

2. **在 Vercel 导入项目**：
   - 打开 [Vercel Dashboard](https://vercel.com/new) -> Import 你的 Git 仓库。
   - Framework Preset 选择 **Next.js**。

3. **配置环境变量 (Environment Variables)**：
   将 `.env.local` 中的变量填入 Vercel：
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_DEVELOPER_TOKEN`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_LOGIN_CUSTOMER_ID`
   - `GOOGLE_ADS_API_VERSION`: `v26`
   - `AUTH_PASSWORD`: `你的自定义密码`
   - `AUTH_SECRET`: `任意长字符串密钥`

4. 点击 **Deploy**，1 分钟即可分配到你的公开/自定义域名！

---

## ☁️ 部署到 Cloudflare Pages

1. **安装 Cloudflare Next 适配器**（如果使用 Pages Functions）：
   - 在 Cloudflare Dashboard 新建 Pages 项目并连接 GitHub 仓库。
   - 构建命令 (Build command)：`npx @cloudflare/next-on-pages`
   - 输出目录 (Build output directory)：`.vercel/output/static`
2. 在 Cloudflare Pages 设置中的 **Environment Variables** 同样填入上述环境变量即可。
