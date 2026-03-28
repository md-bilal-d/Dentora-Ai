#!/bin/bash
echo "Starting Dentora AI Application on Hugging Face..."

echo "Starting AI Backend on Port 5000..."
python3 /app/server.py > /tmp/py_logs.txt 2>&1 &

echo "Starting Node Backend on Port 5001..."
cd /app/server && node index.js > /tmp/node_logs.txt 2>&1 &

echo "Waiting 15 seconds for backends to initialize..."
sleep 15

echo "Starting Nginx Frontend on Port 7860..."
nginx

echo "Streaming logs so Hugging Face registers the Space correctly..."
tail -f /tmp/node_logs.txt /tmp/py_logs.txt /tmp/nginx_error.log
