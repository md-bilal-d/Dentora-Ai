#!/bin/bash

# Start AI Backend (Python Flask)
echo "Starting AI Backend on Port 5000..."
python3 /app/server.py &

# Start Node Backend (Express)
echo "Starting Node Backend on Port 5001..."
cd /app/server && node index.js &

# Start Nginx in the foreground to keep container alive
echo "Starting Nginx on Port 7860..."
nginx -g "daemon off;"
