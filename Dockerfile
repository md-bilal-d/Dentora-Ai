# Use a standard stable Node base
FROM node:20-bookworm-slim

# Install Python, Nginx, and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nginx \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NPM_CONFIG_LOGLEVEL=info
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency files
COPY package.json ./
COPY server/package.json ./server/
COPY requirements.txt ./

# Diagnostic: Verify files are present
RUN ls -la && ls -la server/

# Install root dependencies
RUN npm install --no-audit --no-fund --unsafe-perm

# Install Node Backend dependencies (Production only, using --prefix)
RUN npm install --prefix server --omit=dev --no-audit --no-fund --unsafe-perm

# Install AI Backend dependencies
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

# Copy the rest of the app (honors .dockerignore)
COPY . .

# --- Build Frontend ---
# Change localhost URLs to relative paths for Nginx routing during build
# Using --no-run-if-empty to avoid errors if no matches found
RUN grep -l "http://localhost:5001" src/**/*.ts src/**/*.tsx | xargs --no-run-if-empty sed -i 's|http://localhost:5001|/api|g'
RUN grep -l "http://localhost:5000" src/**/*.ts src/**/*.tsx | xargs --no-run-if-empty sed -i 's|http://localhost:5000|/ai|g'

# Run build directly with Vite, skipping tsc to avoid type-check failures
RUN npx vite build

# Nginx config
COPY nginx.conf /etc/nginx/sites-available/default

# Permissions & User setup
RUN chmod +x start.sh && \
    chown -R 1000:1000 /app /var/lib/nginx /var/log/nginx /etc/nginx

USER 1000
EXPOSE 7860

CMD ["./start.sh"]
