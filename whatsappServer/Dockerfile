# Use Node.js 20 LTS as base image
FROM node:lts-alpine

# Install Chrome dependencies for WhatsApp Web
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Chrome path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    HOST=0.0.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to keep image smaller
RUN npm prune --production

# Create necessary directories and copy secrets
RUN mkdir -p /app/secrets /app/public
COPY secrets/ /app/secrets/
COPY public/ /app/public/

# Expose port 5210
EXPOSE 5210

# Start the application
CMD ["npm", "start"]
