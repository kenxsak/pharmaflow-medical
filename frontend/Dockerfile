# Multi-stage build for React application

# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set Node memory limit (increase to 4GB)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Set the API URL at build time so CRA bakes it into the bundle
ENV REACT_APP_BACKEND_URL=http://localhost:8080
ENV REACT_APP_API_URL=http://localhost:8080/api/v1
ENV REACT_APP_LEGACY_API_URL=http://localhost:8080/lifepill/v1
ENV REACT_APP_WS_URL=http://localhost:8080/ws
ENV REACT_APP_STORE_NAME=PharmaFlow

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
