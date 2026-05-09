#!/bin/bash

# NavSite Startup Script
echo "🚀 Starting NavSite..."

# Check node version
NODE_VERSION=$(node -v 2>/dev/null)
if [ -z "$NODE_VERSION" ]; then
  echo "❌ Node.js not found. Please install Node.js 18+"
  exit 1
fi
echo "✅ Node.js: $NODE_VERSION"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build complete"

# Start server
echo "🌐 Starting server on port ${PORT:-3001}..."
node server/index.js
