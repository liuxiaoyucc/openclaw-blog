# 博客系统数据库结构

## 概述

- **存储方式**: Redis (优先) / 内存 (备用)
- **Redis Key 前缀**: `blog:`
- **数据格式**: JSON

---

## 数据实体

### 1. 文章 (Posts)

**Redis Key**: `blog:posts`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | UUID 主键 |
| `title` | string | ✅ | 文章标题 |
| `content` | string | ✅ | 文章内容 (Markdown) |
| `author` | string | ✅ | 作者名 |
| `tags` | array | ❌ | 标签数组 |
| `status` | string | ✅ | `published` / `draft` |
| `pinned` | boolean | ❌ | 是否置顶 |
| `categoryId` | string | ❌ | 分类ID |
| `views` | number | ❌ | 阅读次数 |
| `likes` | number | ❌ | 点赞数 |
| `createdAt` | string | ✅ | ISO 8601 时间戳 |
| `updatedAt` | string | ✅ | ISO 8601 时间戳 |

**示例**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Hello World",
  "content": "# 第一篇文章\n\n内容...",
  "author": "admin",
  "tags": ["技术", "随笔"],
  "status": "published",
  "pinned": false,
  "categoryId": "cat-001",
  "views": 100,
  "likes": 5,
  "createdAt": "2025-04-05T10:00:00.000Z",
  "updatedAt": "2025-04-05T10:00:00.000Z"
}
```

---

### 2. 用户 (Users)

**Redis Key**: `blog:users`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | UUID 主键 |
| `username` | string | ✅ | 用户名 (唯一) |
| `password` | string | ✅ | SHA256 哈希密码 |
| `displayName` | string | ✅ | 显示名称 |
| `avatar` | string | ❌ | 头像URL |
| `role` | string | ❌ | `admin` / `user` |
| `createdAt` | string | ✅ | ISO 8601 时间戳 |

**默认管理员**:
- 用户名: `admin`
- 密码: `admin123` (SHA256 哈希存储)
- 角色: `admin`

---

### 3. 评论 (Comments)

**Redis Key**: `blog:comments`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | UUID 主键 |
| `postId` | string | ✅ | 关联文章ID |
| `content` | string | ✅ | 评论内容 |
| `author` | string | ✅ | 评论者 |
| `createdAt` | string | ✅ | ISO 8601 时间戳 |

---

### 4. 分类 (Categories)

**Redis Key**: `blog:categories`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | UUID 主键 |
| `name` | string | ✅ | 分类名称 (唯一) |
| `description` | string | ❌ | 分类描述 |
| `createdAt` | string | ✅ | ISO 8601 时间戳 |

---

### 5. 会话 (Sessions)

**Redis Key**: `blog:sessions`

| 字段 | 类型 | 说明 |
|------|------|------|
| `<token>` | object | 键为 token 字符串 |
| `userId` | string | 关联用户ID |
| `createdAt` | string | ISO 8601 时间戳 |

**结构**:
```json
{
  "a1b2c3d4e5f6...": {
    "userId": "user-uuid",
    "createdAt": "2025-04-05T10:00:00.000Z"
  }
}
```

---

## 索引与查询

### 支持的查询条件

| 实体 | 查询字段 | 方式 |
|------|----------|------|
| Posts | `status` | 精确匹配 |
| Posts | `author` | 精确匹配 |
| Posts | `tag` | 数组包含 |
| Posts | `categoryId` | 精确匹配 |
| Posts | `search` (title/content) | 模糊匹配 |
| Posts | `pinned` | 排序优先 |
| Comments | `postId` | 精确匹配 |

### 排序规则

1. **置顶优先**: `pinned=true` 的文章排在前面
2. **时间倒序**: 按 `createdAt` 降序排列

---

## API 端点

### 文章相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/posts` | 获取文章列表 (支持分页/搜索/筛选) |
| GET | `/api/posts/search?q=xxx` | 全文搜索 |
| GET | `/api/posts/rank` | 获取阅读排行 TOP5 |
| GET | `/api/posts/:id` | 获取单篇文章 |
| POST | `/api/posts` | 创建文章 |
| PUT | `/api/posts/:id` | 更新文章 |
| DELETE | `/api/posts/:id` | 删除文章 |
| POST | `/api/posts/:id/like` | 点赞文章 |

### 用户相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |

### 评论相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/posts/:id/comments` | 获取文章评论 |
| POST | `/api/posts/:id/comments` | 添加评论 |
| DELETE | `/api/comments/:id` | 删除评论 |

### 分类相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/categories` | 获取所有分类 |
| POST | `/api/categories` | 创建分类 (需管理员) |
| PUT | `/api/categories/:id` | 更新分类 (需管理员) |
| DELETE | `/api/categories/:id` | 删除分类 (需管理员) |

### 统计相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/stats` | 博客统计数据 |
| GET | `/api/archive` | 文章归档数据 |
| GET | `/api/rss` | RSS 订阅源 |
| GET | `/api/health` | 健康检查 |

### 文件上传

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/upload` | 上传图片 (max 5MB) |

---

## 数据关系图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Users     │     │    Posts    │     │ Categories  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │◄────│ id          │
│ username    │     │ title       │     │ name        │
│ password    │     │ content     │     │ description │
│ displayName │     │ author      │────►│             │
│ role        │     │ tags[]      │     └─────────────┘
│ createdAt   │     │ status      │
└─────────────┘     │ pinned      │
         │          │ categoryId  │────►
         │          │ views       │
         ▼          │ likes       │
┌─────────────┐     │ createdAt   │
│  Sessions   │     │ updatedAt   │
├─────────────┤     └─────────────┘
│ token       │              │
│ userId      │◄─────────────┘
│ createdAt   │
└─────────────┘         │
                        ▼
               ┌─────────────┐
│   Comments  │
├─────────────┤
│ id          │
│ postId      │◄─────────────┐
│ content     │              │
│ author      │              │
│ createdAt   │              │
└─────────────┘              │
                             │
                             ▼
                    ┌─────────────┐
                    │    Tags     │
                    │  (embedded  │
                    │   in posts) │
                    └─────────────┘
```

---

## 文件存储

- **上传目录**: `/server/uploads/`
- **访问URL**: `http://localhost:3001/uploads/<filename>`
- **支持格式**: jpeg, jpg, png, gif, webp, svg
- **大小限制**: 5MB

---

## 备份建议

```bash
# Redis 备份
redis-cli SAVE

# 或导出为 JSON
redis-cli GET blog:posts > posts.json
redis-cli GET blog:users > users.json
redis-cli GET blog:comments > comments.json
redis-cli GET blog:categories > categories.json
```
