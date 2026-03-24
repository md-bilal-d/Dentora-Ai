# Use a standard stable Node base
FROM node:20-bookworm-slim

# Install system dependencies (Python, Nginx)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nginx \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NPM_CONFIG_LOGLEVEL=error
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy everything (whitelist .dockerignore ensures minimal context)
COPY . .

# Install Node backend dependencies
RUN npm install --prefix server --omit=dev --no-audit --no-fund --unsafe-perm && \
    npm cache clean --force

# Install Python dependencies (ultralytics brings its own torch)
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

# Configure nginx and set permissions for non-root operation
RUN cp nginx.conf /etc/nginx/sites-available/default && \
    chmod +x start.sh && \
    sed -i 's|/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf && \
    sed -i 's|^user |#user |g' /etc/nginx/nginx.conf && \
    sed -i 's|/var/log/nginx/error.log|/tmp/nginx_error.log|g' /etc/nginx/nginx.conf && \
    mkdir -p /tmp /run/nginx && \
    chown -R 1000:1000 /app /var/lib/nginx /var/log/nginx /etc/nginx /run/nginx /tmp

USER 1000
EXPOSE 7860

CMD ["./start.sh"]
