# PDF导出功能修复说明

## 问题背景
原PDF导出功能使用`puppeteer-core`，在WSL环境中需要系统中已安装Chrome/Chromium。但在WSL环境中，Chrome通常未安装，导致PDF导出失败。

## 解决方案
已实现多方案PDF生成策略，支持：

### 1. 自动检测和安装Chrome（首选方案）
- 自动检测系统中是否已安装Chrome/Chromium
- 支持在Debian/Ubuntu系统上自动安装Chrome
- 支持通过环境变量指定Chrome路径

### 2. 使用html-pdf作为备选方案
- 当puppeteer失败时，自动降级到html-pdf
- html-pdf已作为依赖安装，无需额外配置

### 3. 环境变量配置支持
支持通过环境变量灵活配置PDF生成策略

## 使用方法

### 替换原文件
```bash
# 备份原文件
cp ~/my-blog/server/routes/pdf.js ~/my-blog/server/routes/pdf.js.backup

# 使用修复后的文件
cp ~/my-blog/server/routes/pdf-fixed.js ~/my-blog/server/routes/pdf.js
```

### 环境变量配置

| 环境变量 | 说明 | 默认值 | 可选值 |
|---------|------|--------|--------|
| `PDF_GENERATION_METHOD` | PDF生成方法 | `auto` | `puppeteer`, `html-pdf`, `auto` |
| `CHROME_PATH` | Chrome可执行文件路径 | `null` | 任意有效路径 |
| `PDF_LOG_LEVEL` | 日志级别 | `info` | `error`, `warn`, `info`, `debug` |

#### 配置示例
```bash
# 强制使用html-pdf
export PDF_GENERATION_METHOD=html-pdf

# 指定Chrome路径（Windows WSL）
export CHROME_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

# 启用详细日志
export PDF_LOG_LEVEL=debug
```

### API接口（保持不变）

#### 1. 导出PDF
```
GET /api/pdf/export/:postId
```
- 参数：`postId` - 文章ID
- 返回：PDF文件下载

#### 2. 预览HTML
```
GET /api/pdf/preview/:postId
```
- 参数：`postId` - 文章ID
- 返回：HTML预览页面

#### 3. 健康检查
```
GET /api/pdf/health
```
- 返回：服务状态信息

#### 4. 系统信息（新增）
```
GET /api/pdf/system-info
```
- 返回：系统信息和PDF配置

## 工作流程

### 自动模式（默认）
1. 尝试使用puppeteer生成PDF
2. 如果puppeteer失败（Chrome未安装等），自动切换到html-pdf
3. 返回生成的PDF文件

### 手动指定模式
- `puppeteer`: 只使用puppeteer，失败时返回错误
- `html-pdf`: 只使用html-pdf，失败时返回错误

## 错误处理

### 错误代码
| 错误代码 | 说明 | HTTP状态码 |
|---------|------|------------|
| `MISSING_POST_ID` | 文章ID为空 | 400 |
| `POST_NOT_FOUND` | 文章不存在 | 404 |
| `PDF_GENERATION_FAILED` | PDF生成失败 | 500 |
| `INTERNAL_SERVER_ERROR` | 服务器内部错误 | 500 |

### 日志输出
支持不同级别的日志输出：
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息（默认）
- `debug`: 调试信息

## 测试方法

### 1. 检查依赖
```bash
cd ~/my-blog/server
npm list puppeteer-core html-pdf
```

### 2. 测试PDF导出
```bash
# 启动服务器
npm run dev

# 测试导出（需要有效的postId）
curl -o test.pdf "http://localhost:3000/api/pdf/export/test-post-1"
```

### 3. 测试HTML预览
```bash
curl "http://localhost:3000/api/pdf/preview/test-post-1"
```

### 4. 检查健康状态
```bash
curl "http://localhost:3000/api/pdf/health"
```

## 故障排除

### 问题1: Chrome未安装
**症状**: puppeteer失败，自动降级到html-pdf
**解决方案**:
1. 安装Chrome（推荐）:
   ```bash
   # Debian/Ubuntu
   wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
   sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
   sudo apt-get update
   sudo apt-get install -y google-chrome-stable
   ```
2. 或使用Windows Chrome（WSL）:
   ```bash
   export CHROME_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
   ```
3. 或强制使用html-pdf:
   ```bash
   export PDF_GENERATION_METHOD=html-pdf
   ```

### 问题2: html-pdf依赖缺失
**症状**: `Cannot find module 'html-pdf'`
**解决方案**:
```bash
cd ~/my-blog/server
npm install html-pdf@^3.0.1
```

### 问题3: 内存不足
**症状**: PDF生成过程中崩溃
**解决方案**:
1. 增加Node.js内存限制:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```
2. 简化HTML模板
3. 使用更简单的PDF生成选项

## 性能优化建议

### 1. 缓存PDF文件
对于频繁访问的文章，可以缓存生成的PDF文件：
```javascript
// 在generatePDF函数中添加缓存逻辑
const cache = new Map();
const CACHE_TTL = 3600000; // 1小时
```

### 2. 异步生成
对于大型文档，可以考虑异步生成PDF并通知用户下载。

### 3. 资源优化
- 压缩HTML中的CSS和JavaScript
- 使用CDN加载外部资源
- 优化图片大小

## 扩展功能

### 1. 支持更多PDF选项
可以扩展支持：
- 自定义页眉页脚
- 水印添加
- 多语言支持
- 分页控制

### 2. 批量导出
添加批量导出功能，支持一次导出多篇文章。

### 3. 进度跟踪
添加WebSocket支持，实时跟踪PDF生成进度。

## 版本历史

### v1.0.0 (修复版本)
- 修复WSL环境中Chrome缺失问题
- 实现多方案PDF生成策略
- 添加环境变量配置支持
- 增强错误处理和日志记录
- 保持原有API接口不变

## 技术支持
如有问题，请检查：
1. 系统日志：`tail -f ~/my-blog/server/logs/*.log`
2. PDF服务日志：查看控制台输出
3. 环境变量配置：`env | grep PDF`
4. 依赖状态：`npm list --depth=0`