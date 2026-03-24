#!/bin/bash

# Start AI Backend (Python Flux)
echo "Starting AI Backend on Port 5000..."
python server.py &

# Start Node Backend (Express)
echo "Starting Node Backend on Port 5001..."
cd server && npm start &
cd ..

# Start Nginx in the foreground to keep container alive
echo "Starting Nginx on Port 7860..."
nginx -g "daemon off;"
