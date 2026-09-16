#!/bin/bash
set -e

echo "========================================================"
echo " 🌲 PINECONE COMPLIANCE & SECURITY AUDITOR CONSOLE 🌲"
echo "========================================================"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Start Backend
echo "➔ [1/2] Starting Air-Gapped Backend Engine on port 8000..."
cd "$ROOT_DIR"
if [ -d "backend/venv" ]; then
    PYTHONPATH=. backend/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
elif command -v uvicorn > /dev/null; then
    PYTHONPATH=. uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
else
    echo "⚠️ Python environment not found. Please activate backend/venv."
fi

# 2. Start Frontend
echo "➔ [2/2] Starting Pinecone Console UI on port 3000..."
cd "$ROOT_DIR/frontend"

# Free port 3000 if occupied
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Launch Vite
npm run dev -- --host 0.0.0.0 --port 3000
