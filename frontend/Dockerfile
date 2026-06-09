# frontend/Dockerfile — AgroGen IA Frontend
# Stage 1: build do React com Vite
FROM node:20-alpine AS builder

# Vars lidas pelo código em runtime de build (src/lib/api/client.ts):
#   VITE_API_URL       — baseURL do axios (default /api/v1, roteado pelo Nginx)
#   VITE_USE_REAL_API  — "true" desliga os mocks e consome o backend real
ARG VITE_API_URL=/api/v1
ARG VITE_USE_REAL_API=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_REAL_API=$VITE_USE_REAL_API

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: servir com Nginx
FROM nginx:1.25-alpine

# Remove config padrão e coloca a do projeto (SPA catch-all)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
