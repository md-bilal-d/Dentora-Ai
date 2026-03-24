# Use a base image with Node.js and Python
FROM nikolaik/python-nodejs:python3.10-nodejs20

# Install Nginx
USER root
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files first to leverage caching and avoid local node_modules
COPY package*.json ./
COPY server/package*.json ./server/
COPY requirements.txt ./

# Install root dependencies
RUN npm install

# Install Node Backend dependencies
RUN cd server && npm install

# Install AI Backend dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files (honors .dockerignore)
COPY . .

# --- Build Frontend ---
# Change localhost URLs to relative paths for Nginx routing during build
RUN grep -l "http://localhost:5001" src/**/*.ts src/**/*.tsx | xargs sed -i 's|http://localhost:5001|/api|g'
RUN grep -l "http://localhost:5000" src/**/*.ts src/**/*.tsx | xargs sed -i 's|http://localhost:5000|/ai|g'

# Run build
RUN npm run build

# --- Configure Nginx ---
COPY nginx.conf /etc/nginx/sites-available/default

# --- Final Prep ---
# Ensure start script is executable
RUN chmod +x start.sh

# Hugging Face Spaces run as a non-root user (ID 1000)
# We need to ensure permissions for Nginx and our app
RUN chown -R 1000:1000 /app /var/lib/nginx /var/log/nginx /etc/nginx
USER 1000

# Expose the HF default port
EXPOSE 7860

# Start all services
CMD ["./start.sh"]
