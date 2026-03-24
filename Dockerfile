# Use a standard stable Node base
FROM node:20-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nginx \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set robust environment variables
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NPM_CONFIG_LOGLEVEL=error
ENV CI=true
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency files
COPY package.json ./
COPY server/package.json ./server/
COPY requirements.txt ./

# --- CONSOLIDATED INSTALL & BUILD ---
# Combining everything into one RUN to avoid layer overhead and cache flakiness
RUN npm install --no-audit --no-fund --unsafe-perm && \
    npm install --prefix server --omit=dev --no-audit --no-fund --unsafe-perm && \
    pip install --no-cache-dir -r requirements.txt --break-system-packages && \
    npm cache clean --force

# Copy the rest of the app
COPY . .

# --- Build Frontend ---
RUN (grep -l "http://localhost:5001" src/**/*.ts src/**/*.tsx | xargs --no-run-if-empty sed -i 's|http://localhost:5001|/api|g' || true) && \
    (grep -l "http://localhost:5000" src/**/*.ts src/**/*.tsx | xargs --no-run-if-empty sed -i 's|http://localhost:5000|/ai|g' || true) && \
    npx vite build

# Nginx config
COPY nginx.conf /etc/nginx/sites-available/default

# Final permissions
RUN chmod +x start.sh && \
    chown -R 1000:1000 /app /var/lib/nginx /var/log/nginx /etc/nginx

USER 1000
EXPOSE 7860

CMD ["./start.sh"]
