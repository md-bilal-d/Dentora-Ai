#!/bin/bash
echo "Starting AI Backend on Port 5000..."
python3 /app/server.py &

echo "Starting Node Backend on Port 5001..."
cd /app/server && node index.js &

echo "Waiting 20 seconds for backends to initialize..."
sleep 20

echo "Starting Nginx on Port 7860..."
nginx -g "daemon off;"
