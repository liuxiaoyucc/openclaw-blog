#!/bin/bash

# Blog Startup Script
# Usage: ./start.sh [dev|build]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-dev}"

echo "🚀 Starting My Blog..."
echo "Mode: $MODE"
echo ""

cd "$PROJECT_DIR"

if [ "$MODE" = "dev" ]; then
    echo "📦 Installing dependencies..."
    cd server && npm install > /dev/null 2>&1 && cd ..
    cd client && npm install > /dev/null 2>&1 && cd ..
    
    echo "🔧 Starting backend server..."
    cd server
    npm start &
    SERVER_PID=$!
    cd ..
    
    echo "⏳ Waiting for backend to start..."
    sleep 3
    
    echo "🎨 Starting frontend dev server..."
    cd client
    npm run dev &
    CLIENT_PID=$!
    cd ..
    
    echo ""
    echo "✅ Blog is running!"
    echo "📖 Frontend: http://localhost:3000"
    echo "🔌 Backend API: http://localhost:3001"
    echo ""
    echo "Press Ctrl+C to stop"
    
    # Wait for both processes
    wait $SERVER_PID $CLIENT_PID
    
elif [ "$MODE" = "build" ]; then
    echo "📦 Building frontend..."
    cd client
    npm install > /dev/null 2>&1
    npm run build
    cd ..
    
    echo ""
    echo "✅ Build complete!"
    echo "📁 Build output: client/dist/"
    echo ""
    echo "To serve the built files:"
    echo "  cd client && npm run preview"
    
else
    echo "Unknown mode: $MODE"
    echo "Usage: ./start.sh [dev|build]"
    exit 1
fi