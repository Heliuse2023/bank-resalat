# استفاده از Python 3.11 با Node.js
FROM python:3.11

# تنظیم متغیرهای محیطی
ENV PYTHONUNBUFFERED=1
ENV NODE_VERSION=18.20.4
ENV YARN_VERSION=1.22.22

# نصب Node.js و Yarn
RUN apt-get update && apt-get install -y curl git && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn@${YARN_VERSION} && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی کامل پروژه
COPY . .

# نصب وابستگی‌های Python
RUN cd backend && pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# نصب وابستگی‌های Node.js و build
RUN cd frontend && \
    yarn install --frozen-lockfile && \
    yarn build

# ایجاد دایرکتوری static و کپی build
RUN mkdir -p static && \
    cp -r frontend/build/* static/ 2>/dev/null || echo "Build files copied"

# ایجاد دایرکتوری‌های ضروری
RUN mkdir -p data/applications data/locations data/photos data/clipboard data/emails && \
    mkdir -p backup/applications backup/locations backup/photos backup/clipboard && \
    chmod -R 755 data backup

# تنظیم دایرکتوری کاری برای اجرا
WORKDIR /app

# expose port
EXPOSE 8000

# اجرای سرور با تنظیمات کامل
CMD ["python", "-m", "uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]