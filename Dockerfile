# Base image
FROM node:20-alpine

# Cài đặt Python, pip và các dependencies cần thiết
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    bash \
    ffmpeg \
    && curl -fsSL https://bun.sh/install | bash \
    && mv /root/.bun/bin/bun /usr/local/bin/

# Cài đặt edge-tts
RUN pip3 install edge-tts

# Tạo symlink cho python3 -> python (để tương thích)
RUN ln -sf /usr/bin/python3 /usr/bin/python

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

