# NavSite - 个人导航站

基于 React + Express + SQLite 构建的个人导航站，支持后台管理编辑。

## 功能特性

- 🎨 Material Design 3 界面风格（淡蓝/白色主题）
- 🔐 SHA256 加密密码保护（密码：`xiaobuawa`）
- ✏️ 全站内容在线编辑（分类、链接、社交按钮）
- 📝 Markdown 格式支持
- 🕐 首页数字时钟
- 💬 每日一言（支持点击刷新）
- 🔗 社交链接按钮（可后台编辑）
- 🖼️ 自定义背景图片
- 🏷️ 自定义站点标题和图标
- 💾 SQLite 持久化存储

## 快速部署（服务器）

### 方式一：直接运行

```bash
# 1. 安装依赖
npm install

# 2. 构建前端
npm run build

# 3. 启动服务器
node server/index.js
```

### 方式二：PM2 守护进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 构建前端
npm run build

# 使用 PM2 启动
pm2 start ecosystem.config.cjs

# 设置开机自启
pm2 startup
pm2 save
```

### 方式三：一键启动脚本

```bash
chmod +x start.sh
./start.sh
```

## Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 数据存储

数据存储在 `data/navsite.db`（SQLite 数据库），请注意备份此文件。

## 管理员功能

1. 点击右上角「管理」按钮
2. 输入密码：`xiaobuawa`
3. 进入编辑模式后，可以：
   - 编辑站点标题、图标、背景图
   - 添加/编辑/删除导航分类
   - 添加/编辑/删除导航链接（支持 Markdown 描述）
   - 管理社交链接按钮

## 端口说明

默认端口：`3001`

可通过环境变量修改：`PORT=8080 node server/index.js`
