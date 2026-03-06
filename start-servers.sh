#!/bin/bash

# Start backend server
cd src/backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend server
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

# Wait for both servers
wait $BACKEND_PID $FRONTEND_PID