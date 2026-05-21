# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Аргументы для сборки (передаются из docker-compose)
ARG VITE_SKILLSWAP_API_URL
# Объявляем их как переменные окружения для процесса сборки
ENV VITE_SKILLSWAP_API_URL=$VITE_SKILLSWAP_API_URL

# Копируем package.json и устанавливаем зависимости
COPY frontend/package*.json ./
RUN npm ci

# Копируем весь исходный код фронтенда (включая его собственный .env, если он есть)
COPY frontend/ ./

RUN npm run build

# Stage 2: Production nginx
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=frontend-builder /app/dist /usr/share/nginx/html/frontend
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]