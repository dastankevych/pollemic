FROM node:23-slim AS base

# Установка зависимостей только для сборки
FROM base AS deps
WORKDIR /app

# Создаем кеш-директорию для npm
RUN mkdir -p /app/.npm-cache

# Настраиваем npm для использования локального кеша
ENV npm_config_cache=/app/.npm-cache

# Копирование файлов package.json и package-lock.json (или yarn.lock)
COPY package.json package-lock.json* yarn.lock* ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Сборка приложения
FROM base AS builder
WORKDIR /app

# Копируем node_modules из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Установка переменных окружения для сборки
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Сборка приложения
RUN npm run build

# Рабочий образ
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Создание пользователя nextjs
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключение на пользователя nextjs
USER nextjs

# Открытие порта 3000
EXPOSE 3000

# Запуск приложения
CMD ["node", "server.js"]