# PDF导出功能使用说明

## 概述

本文档介绍了博客系统的PDF导出功能。该功能允许用户将博客文章导出为格式精美的PDF文件，采用极客风格设计。

## 功能特性

1. **极客风格设计**：采用科技感十足的黑色主题，包含代码高亮、终端风格元素
2. **完整文章内容**：导出包含标题、作者、日期、分类、标签、阅读统计等完整信息
3. **响应式布局**：适配不同屏幕尺寸，打印友好
4. **错误处理**：完善的错误处理机制，提供清晰的错误信息
5. **预览功能**：支持HTML预览，便于调试和查看效果

## API端点

### 1. PDF导出
```
GET /api/pdf/export/:postId
```

**参数**：
- `postId`：文章ID（必填）

**响应**：
- 成功：返回PDF文件流，Content-Type为`application/pdf`
- 失败：返回JSON格式错误信息

**示例**：
```bash
# 导出文章
curl -o article.pdf "http://localhost:3001/api/pdf/export/test-post-001"

# 或直接在浏览器中访问
http://localhost:3001/api/pdf/export/test-post-001
```

### 2. HTML预览
```
GET /api/pdf/preview/:postId
```

**参数**：
- `postId`：文章ID（必填）

**响应**：
- 成功：返回HTML格式的文章预览
- 失败：返回JSON格式错误信息

**示例**：
```bash
# 预览文章HTML
curl "http://localhost:3001/api/pdf/preview/test-post-001"

# 或直接在浏览器中访问
http://localhost:3001/api/pdf/preview/test-post-001
```

### 3. 健康检查
```
GET /api/pdf/health
```

**响应**：
```json
{
  "status": "OK",
  "service": "PDF Export Service",
  "timestamp": "2024-03-21T10:30:00.000Z",
  "features": ["export-pdf", "preview-html"]
}
```

## 错误代码

| 错误代码 | 描述 | HTTP状态码 |
|---------|------|-----------|
| `MISSING_POST_ID` | 文章ID不能为空 | 400 |
| `POST_NOT_FOUND` | 文章不存在 | 404 |
| `PDF_GENERATION_FAILED` | PDF生成失败 | 500 |
| `INTERNAL_SERVER_ERROR` | 服务器内部错误 | 500 |

## 安装依赖

PDF导出功能需要以下依赖：

```bash
cd server
npm install puppeteer-core
```

## 配置说明

### 1. 文章数据源
PDF导出功能需要访问文章数据。默认情况下，它会：
1. 尝试从主应用获取文章数据
2. 如果主应用不可用，会从`routes/test-data.json`加载测试数据

### 2. Puppeteer配置
PDF生成使用`puppeteer-core`，配置如下：
```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### 3. PDF选项
生成的PDF使用以下选项：
```javascript
await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
  displayHeaderFooter: true,
  headerTemplate: '...',
  footerTemplate: '...'
});
```

## 测试数据

系统包含测试数据文件`routes/test-data.json`，包含以下测试文章：

1. **test-post-001**：深入理解Node.js事件循环
2. **test-post-002**：React Hooks最佳实践

## 测试方法

### 1. 运行测试脚本
```bash
cd server
npm run test-pdf
```

### 2. 手动测试
1. 启动服务器：
   ```bash
   npm start
   ```

2. 测试PDF导出：
   ```bash
   # 导出测试文章
   curl -o output.pdf "http://localhost:3001/api/pdf/export/test-post-001"
   
   # 预览HTML
   curl "http://localhost:3001/api/pdf/preview/test-post-001" > preview.html
   ```

3. 检查生成的文件：
   - `output.pdf`：导出的PDF文件
   - `preview.html`：HTML预览文件

## 集成到主应用

PDF导出功能已经集成到主应用中。在主应用启动时，会自动加载PDF路由：

```javascript
// 在index.js中添加
const pdfRouter = require('./routes/pdf');
app.use('/api/pdf', pdfRouter);
```

## 样式定制

PDF的样式定义在`routes/pdf.js`的`generateGeekHTML`函数中。可以修改以下部分：

1. **颜色主题**：修改CSS中的颜色变量
2. **字体**：修改Google Fonts引入和字体设置
3. **布局**：调整容器、边距、间距等
4. **元素样式**：修改代码块、引用、列表等元素的样式

## 性能考虑

1. **PDF生成时间**：首次生成可能需要较长时间（启动浏览器）
2. **内存使用**：Puppeteer会占用一定内存
3. **并发处理**：建议在生产环境中使用队列处理大量PDF生成请求

## 故障排除

### 1. PDF生成失败
- 检查puppeteer-core是否安装正确
- 检查系统是否支持headless Chrome
- 查看服务器日志获取详细错误信息

### 2. 文章数据获取失败
- 检查测试数据文件是否存在
- 检查文章ID是否正确
- 查看服务器日志获取详细错误信息

### 3. 样式显示问题
- 使用HTML预览功能检查样式
- 检查CSS是否正确加载
- 验证字体文件是否可访问

## 扩展功能建议

1. **缓存机制**：缓存已生成的PDF文件
2. **批量导出**：支持多篇文章批量导出
3. **自定义模板**：允许用户选择不同的PDF模板
4. **水印功能**：添加自定义水印
5. **统计功能**：记录PDF导出次数

## 许可证

本功能遵循MIT许可证。