#!/bin/bash

set -e

echo "Starting FitAgent..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3001"
echo ""

# 启动后端
cd /Users/sunwu/career/fitagent/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# 启动前端
cd /Users/sunwu/career/fitagent/frontend
npm run dev -- -p 3001 &
FRONTEND_PID=$!

# Ctrl+C 时同时关闭前后端
trap "echo 'Stopping FitAgent...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
