#!/bin/bash

# PDF导出功能测试启动脚本
# 用法: ./start-pdf-test.sh [port]

set -e

PORT=${1:-3002}
SERVER_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SERVER_DIR/pdf-test.log"

echo "🚀 启动PDF导出功能测试服务器"
echo "端口: $PORT"
echo "日志文件: $LOG_FILE"
echo ""

# 检查是否已安装依赖
echo "🔍 检查依赖..."
if [ ! -f "$SERVER_DIR/package.json" ]; then
    echo "❌ 未找到package.json"
    exit 1
fi

# 设置环境变量
export NODE_ENV=development
export PDF_GENERATION_METHOD=auto
export PDF_LOG_LEVEL=info
export PORT=$PORT

echo "📋 环境变量配置:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PDF_GENERATION_METHOD: $PDF_GENERATION_METHOD"
echo "  PDF_LOG_LEVEL: $PDF_LOG_LEVEL"
echo "  PORT: $PORT"
echo ""

# 备份原文件并替换为修复版本
echo "🔄 准备PDF路由文件..."
if [ -f "$SERVER_DIR/routes/pdf.js" ]; then
    if [ ! -f "$SERVER_DIR/routes/pdf.js.backup" ]; then
        cp "$SERVER_DIR/routes/pdf.js" "$SERVER_DIR/routes/pdf.js.backup"
        echo "✅ 已备份原文件: pdf.js -> pdf.js.backup"
    fi
fi

if [ -f "$SERVER_DIR/routes/pdf-fixed.js" ]; then
    cp "$SERVER_DIR/routes/pdf-fixed.js" "$SERVER_DIR/routes/pdf.js"
    echo "✅ 已应用修复版本: pdf-fixed.js -> pdf.js"
else
    echo "❌ 未找到修复版本: pdf-fixed.js"
    exit 1
fi

# 确保测试数据存在
if [ ! -f "$SERVER_DIR/routes/test-data.json" ]; then
    echo "📝 创建测试数据..."
    node -e "
const fs = require('fs');
const testData = {
  posts: [{
    id: 'test-post-1',
    title: 'PDF导出功能测试文章',
    author: '测试用户',
    createdAt: new Date().toISOString(),
    content: '# 测试文章\\n\\n这是用于测试PDF导出功能的文章内容。',
    views: 100,
    likes: 25,
    tags: ['测试', 'PDF'],
    categoryId: 'test'
  }],
  categories: [{
    id: 'test',
    name: '测试分类',
    description: '测试用分类'
  }]
};
fs.writeFileSync('$SERVER_DIR/routes/test-data.json', JSON.stringify(testData, null, 2));
console.log('测试数据已创建');
"
fi

# 创建测试服务器
echo "🛠️ 创建测试服务器..."
cat > "$SERVER_DIR/test-server.js" << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';
        console.log(`${timestamp} [HTTP-${logLevel}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    
    next();
});

// 导入PDF路由
try {
    const pdfRouter = require('./routes/pdf.js');
    app.use('/api/pdf', pdfRouter);
    console.log('✅ PDF路由已加载');
} catch (err) {
    console.error('❌ 加载PDF路由失败:', err.message);
    process.exit(1);
}

// 默认路由
app.get('/', (req, res) => {
    res.json({
        message: 'PDF导出测试服务器',
        endpoints: {
            pdf: {
                health: 'GET /api/pdf/health',
                preview: 'GET /api/pdf/preview/:postId',
                export: 'GET /api/pdf/export/:postId',
                systemInfo: 'GET /api/pdf/system-info'
            }
        },
        testPostId: 'test-post-1',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
const server = app.listen(port, () => {
    console.log(`🚀 服务器已启动: http://localhost:${port}`);
    console.log(`📋 可用端点:`);
    console.log(`  1. 首页: http://localhost:${port}/`);
    console.log(`  2. 健康检查: http://localhost:${port}/api/pdf/health`);
    console.log(`  3. HTML预览: http://localhost:${port}/api/pdf/preview/test-post-1`);
    console.log(`  4. PDF导出: http://localhost:${port}/api/pdf/export/test-post-1`);
    console.log(`  5. 系统信息: http://localhost:${port}/api/pdf/system-info`);
    console.log('');
    console.log('📝 测试命令:');
    console.log(`  curl http://localhost:${port}/api/pdf/health`);
    console.log(`  curl http://localhost:${port}/api/pdf/preview/test-post-1`);
    console.log(`  curl -o test.pdf http://localhost:${port}/api/pdf/export/test-post-1`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 收到关闭信号，正在停止服务器...');
    server.close(() => {
        console.log('✅ 服务器已停止');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在停止服务器...');
    server.close(() => {
        console.log('✅ 服务器已停止');
        process.exit(0);
    });
});
EOF

echo "✅ 测试服务器脚本已创建: test-server.js"
echo ""

# 启动服务器
echo "🚀 启动测试服务器..."
echo "日志输出: $LOG_FILE"
echo "按 Ctrl+C 停止服务器"
echo ""

# 清空日志文件
> "$LOG_FILE"

# 启动服务器并记录日志
node "$SERVER_DIR/test-server.js" 2>&1 | tee -a "$LOG_FILE"