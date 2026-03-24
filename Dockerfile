# Use a standard stable Node base
FROM node:20-bookworm-slim

# Install system dependencies (Python, Nginx)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Set robust environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NPM_CONFIG_LOGLEVEL=error
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency files for BACKEND only (Frontend is already built)
COPY server/package.json ./server/
COPY requirements.txt ./

# --- CONSOLIDATED INSTALL ---
# Skipping root (frontend) npm install to save RAM
RUN npm install --prefix server --omit=dev --no-audit --no-fund --unsafe-perm && \
    pip install --no-cache-dir -r requirements.txt --break-system-packages && \
    npm cache clean --force

# Copy pre-built frontend and the rest of the app
# .dockerignore ensures we don't copy local node_modules
COPY . .

# Nginx config
COPY nginx.conf /etc/nginx/sites-available/default

# Final permissions
RUN chmod +x start.sh && \
    chown -R 1000:1000 /app /var/lib/nginx /var/log/nginx /etc/nginx

USER 1000
EXPOSE 7860

CMD ["./start.sh"]
