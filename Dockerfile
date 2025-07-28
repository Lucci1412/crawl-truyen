# Base image
FROM node:20-alpine

# Cài đặt bun (Alpine cần thêm bash và curl)
RUN apk add --no-cache curl bash && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/

# Set working directory
WORKDIR /app

# Copy package files (Chỉ sao chép package.json và bun.lock trước)
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install

# Copy toàn bộ project
COPY . .

# Build app

ENV SKIP_SITEMAP_BUILD=true
RUN bun run build

# Mở cổng
EXPOSE 3000

# Start app
CMD ["bun", "start"]

