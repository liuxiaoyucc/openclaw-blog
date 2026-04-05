# PDF生成模板文档

## 概述

这是一个专为极客博客设计的PDF生成模板，用于将博客文章转换为高质量、可打印的PDF文档。

## 文件结构

```
templates/
├── pdf-template.html      # 主模板文件
├── pdf-example.html       # 使用示例和说明
├── test-output.html       # 测试生成的HTML
└── README.md             # 本文档
```

## 模板特点

### 1. 设计风格
- **极客风格**：深色主题，终端风格设计
- **一致性**：与博客现有样式完全一致
- **专业感**：适合技术文档的排版和布局

### 2. 技术特性
- **代码高亮**：预定义的语法高亮样式
- **图片适配**：自动调整图片大小，保持清晰度
- **中文优化**：专门的中文字体和支持
- **打印友好**：优化的打印样式和分页控制
- **响应式**：适配不同设备和纸张尺寸

### 3. 功能特性
- **变量支持**：Handlebars风格的模板变量
- **元数据展示**：作者、日期、分类、阅读量等
- **标签系统**：美观的标签展示
- **页眉页脚**：专业的页眉和版权信息
- **二维码占位**：预留二维码位置

## 模板变量

| 变量名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `{{title}}` | 字符串 | 文章标题 | "深入理解Node.js事件循环" |
| `{{author}}` | 字符串 | 作者名称 | "极客小明" |
| `{{date}}` | 字符串 | 发布日期 | "2024-04-05" |
| `{{category}}` | 字符串 | 文章分类 | "Node.js" |
| `{{views}}` | 字符串 | 阅读量 | "2567" |
| `{{content}}` | HTML字符串 | 文章HTML内容 | `<h2>标题</h2><p>内容...</p>` |
| `{{tags}}` | 数组 | 标签列表 | `["JavaScript", "Node.js"]` |
| `{{url}}` | 字符串 | 文章URL | "https://blog.com/article/123" |
| `{{generatedDate}}` | 字符串 | PDF生成时间 | "2024-04-05 14:30:00" |

## 使用方法

### 1. 基本使用（Node.js示例）

```javascript
const fs = require('fs');
const path = require('path');

// 读取模板
const templatePath = path.join(__dirname, 'templates', 'pdf-template.html');
let template = fs.readFileSync(templatePath, 'utf8');

// 准备数据
const data = {
    title: "文章标题",
    author: "作者名",
    date: "2024-01-01",
    category: "分类",
    views: "1234",
    content: "<h2>文章内容</h2><p>这里是文章正文...</p>",
    tags: ["标签1", "标签2"],
    url: "https://example.com/article",
    generatedDate: new Date().toLocaleString('zh-CN')
};

// 使用模板引擎替换变量（这里使用简单替换）
Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    let value = data[key];
    
    // 处理数组类型的标签
    if (key === 'tags' && Array.isArray(value)) {
        value = value.map(tag => `<span class="tag">${tag}</span>`).join('');
    }
    
    template = template.replace(new RegExp(placeholder, 'g'), value);
});

// 保存生成的HTML
const outputPath = path.join(__dirname, 'generated', 'article.html');
fs.writeFileSync(outputPath, template);
```

### 2. 使用模板引擎（推荐）

建议使用专业的模板引擎如Handlebars、EJS或Nunjucks：

```javascript
const Handlebars = require('handlebars');
const fs = require('fs');

// 注册标签数组的helper
Handlebars.registerHelper('each', function(context, options) {
    if (!context || context.length === 0) {
        return '';
    }
    let ret = '';
    for (let i = 0, j = context.length; i < j; i++) {
        ret = ret + options.fn(context[i]);
    }
    return ret;
});

// 编译模板
const templateSource = fs.readFileSync('pdf-template.html', 'utf8');
const template = Handlebars.compile(templateSource);

// 生成HTML
const html = template({
    title: "文章标题",
    tags: ["JavaScript", "Node.js"],
    // ... 其他变量
});

fs.writeFileSync('output.html', html);
```

### 3. 转换为PDF

使用puppeteer将HTML转换为PDF：

```javascript
const puppeteer = require('puppeteer');

async function generatePDF(htmlContent, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // 设置HTML内容
    await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
    });
    
    // 生成PDF
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
        }
    });
    
    await browser.close();
}

// 使用示例
generatePDF(template, 'output.pdf');
```

## 样式定制

### 修改颜色主题

模板使用CSS变量定义颜色，可以在`:root`部分修改：

```css
:root {
    --bg-primary: #0d1117;        /* 主背景色 */
    --bg-secondary: #161b22;      /* 次要背景色 */
    --text-primary: #c9d1d9;      /* 主文字色 */
    --accent-green: #7ee787;      /* 绿色强调色 */
    --accent-blue: #79c0ff;       /* 蓝色强调色 */
    /* ... 其他变量 */
}
```

### 添加自定义样式

可以在模板的`<style>`标签末尾添加自定义CSS：

```css
/* 自定义样式 */
.custom-element {
    border: 2px solid var(--accent-purple);
    padding: 15px;
    margin: 20px 0;
}
```

## 最佳实践

### 1. 图片处理
- 使用绝对路径或Base64编码的图片
- 确保图片在PDF生成时可用
- 为图片添加`max-width: 100%`样式

### 2. 字体优化
- 模板已包含中文字体（Noto Sans SC）
- 确保服务器能访问Google Fonts
- 考虑将字体本地化以提高性能

### 3. 代码高亮
- 模板包含基本的代码高亮样式
- 对于复杂需求，可集成highlight.js或Prism.js
- 服务端高亮通常比客户端更可靠

### 4. 性能优化
- 压缩最终的HTML输出
- 使用CSS精灵图减少请求
- 内联关键CSS

## 测试和验证

已包含测试脚本`test-pdf-template.js`，可以验证模板功能：

```bash
cd ~/my-blog/server
node test-pdf-template.js
```

测试脚本会：
1. 检查模板文件完整性
2. 验证所有必需的元素
3. 生成测试HTML文件
4. 输出详细的检查报告

## 故障排除

### 常见问题

1. **变量未替换**
   - 检查变量名拼写是否正确
   - 确保使用正确的模板引擎语法
   - 验证数据对象的结构

2. **图片不显示**
   - 检查图片路径是否为绝对路径
   - 确保图片在PDF生成时可访问
   - 考虑使用Base64编码内联图片

3. **字体问题**
   - 检查网络连接是否能访问Google Fonts
   - 考虑使用本地字体文件
   - 添加字体回退方案

4. **PDF生成质量差**
   - 确保启用`printBackground: true`
   - 调整页面边距和尺寸
   - 检查CSS的打印媒体查询

### 调试建议

1. 先生成HTML文件，在浏览器中预览
2. 使用浏览器的打印预览功能测试
3. 逐步添加复杂内容，验证每一步
4. 查看生成的PDF的日志和错误信息

## 更新日志

### v1.0.0 (2024-04-05)
- 初始版本发布
- 基于博客现有样式设计
- 支持所有核心功能
- 包含完整文档和测试

## 许可证

本模板遵循MIT许可证。可以自由使用、修改和分发。

## 支持

如有问题或建议，请：
1. 查看`pdf-example.html`中的详细示例
2. 运行测试脚本验证功能
3. 检查常见问题部分
4. 联系开发团队获取支持