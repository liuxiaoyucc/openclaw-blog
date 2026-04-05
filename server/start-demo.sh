#!/bin/bash

# PDF导出功能演示脚本

echo "🚀 启动博客PDF导出功能演示"
echo "=========================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 安装依赖
echo "📦 检查并安装依赖..."
cd "$(dirname "$0")"
npm install

# 启动服务器
echo "🌐 启动服务器..."
echo "   服务器将在后台运行，日志输出到 server.log"
nohup node index.js > server.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 检查服务器是否运行
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ 服务器启动失败，请检查 server.log"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ 服务器已启动 (PID: $SERVER_PID)"
echo ""

# 显示可用端点
echo "📡 可用端点："
echo "   1. 主应用健康检查: http://localhost:3001/api/health"
echo "   2. PDF服务健康检查: http://localhost:3001/api/pdf/health"
echo "   3. 文章HTML预览: http://localhost:3001/api/pdf/preview/test-post-001"
echo "   4. PDF导出: http://localhost:3001/api/pdf/export/test-post-001"
echo ""

# 测试PDF导出
echo "🧪 测试PDF导出功能..."
echo "   正在导出测试文章..."

# 导出PDF
curl -s -o "geek-blog-demo.pdf" "http://localhost:3001/api/pdf/export/test-post-001"

if [ -f "geek-blog-demo.pdf" ]; then
    PDF_SIZE=$(stat -c%s "geek-blog-demo.pdf")
    echo "✅ PDF导出成功！"
    echo "   文件: geek-blog-demo.pdf"
    echo "   大小: $PDF_SIZE 字节"
else
    echo "❌ PDF导出失败"
fi

echo ""
echo "📋 演示完成！"
echo ""
echo "🛑 要停止服务器，运行: kill $SERVER_PID"
echo "📄 查看服务器日志: tail -f server.log"
echo ""
echo "💡 提示："
echo "   1. 在浏览器中打开预览链接查看HTML效果"
echo "   2. 使用PDF阅读器打开生成的PDF文件"
echo "   3. 可以修改 test-data.json 添加更多测试文章"
echo "   4. 查看 PDF_EXPORT_README.md 获取完整文档"

# 保持脚本运行
echo ""
read -p "按回车键停止服务器并退出..." -n 1 -r
echo ""

# 停止服务器
echo "🛑 停止服务器..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "✅ 演示结束！"