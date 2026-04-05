# 我的博客

一个使用 React + Node.js + Redis 构建的个人博客系统。

## 技术栈

- **前端**: React 18 + Vite + React Router
- **后端**: Node.js + Express
- **数据库**: Redis (当前使用内存存储作为替代)
- **部署**: 本地运行

## 项目结构

```
my-blog/
├── client/          # React 前端
│   ├── src/
│   │   ├── pages/   # 页面组件
│   │   ├── App.jsx
│   │   └── ...
│   └── package.json
├── server/          # Node.js 后端
│   ├── index.js     # API 服务器
│   └── package.json
├── start.sh         # 启动脚本
└── package.json     # 根目录配置
```

## 功能特性

- ✅ 文章列表展示
- ✅ 文章详情查看
- ✅ 创建新文章
- ✅ 编辑文章
- ✅ 删除文章
- ✅ 响应式设计

## 快速开始

### 开发模式

```bash
# 一键启动前后端
npm run dev

# 或分别启动
npm run server  # 后端: http://localhost:3001
npm run client  # 前端: http://localhost:3000
```

### 构建生产版本

```bash
npm run build
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/posts | 获取所有文章 |
| GET | /api/posts/:id | 获取单篇文章 |
| POST | /api/posts | 创建文章 |
| PUT | /api/posts/:id | 更新文章 |
| DELETE | /api/posts/:id | 删除文章 |
| GET | /api/health | 健康检查 |

## 连接 Redis

当前系统未安装 Redis，使用的是内存存储。如需连接 Redis：

1. 安装 Redis:
   ```bash
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. 取消 `server/index.js` 中的 Redis 相关代码注释

## 访问地址

- 博客首页: http://localhost:3000
- API 文档: http://localhost:3001/api/health