# 博客系统项目记录

## 项目位置
- 前端: `~/my-blog/client/`
- 后端: `~/my-blog/server/`
- 启动命令: `cd ~/my-blog && npm run dev`

## 技术栈
- 前端: React + Vite + ReactMarkdown
- 后端: Node.js + Express + Redis
- 样式: 极客风格深色主题

## 已实现功能
1. ✅ Markdown 编辑器（支持图片上传）
2. ✅ 文章 CRUD（创建、读取、更新、删除）
3. ✅ 标签系统
4. ✅ 草稿/发布状态
5. ✅ 文章置顶
6. ✅ 评论系统
7. ✅ 点赞功能
8. ✅ 浏览量统计
9. ✅ 用户登录/注册
10. ✅ 归档页面（按年月）
11. ✅ 标签云页面
12. ✅ 统计页面
13. ✅ 目录树渲染（├── └─）
14. ✅ RSS 订阅
15. ✅ 全文搜索

## 管理员账号
- 用户名: `admin`
- 密码: `admin123`

## 访问地址
- 本地: http://localhost:3000
- Windows: http://192.168.104.236:3000

## 端口转发（Windows 访问 WSL）
```powershell
$wslIp = (wsl hostname -I).Trim().Split()[0]
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIp
```

## 待办/可优化
- [x] 文章分类功能 ✅ 已完成（2026-04-04）
- [x] 主题切换（深色/浅色）✅ 已完成（2026-04-04）
- [x] 全文搜索优化 ✅ 已完成（2026-04-05）
- [ ] 缓存优化
