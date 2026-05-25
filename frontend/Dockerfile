FROM node:20-alpine AS builder
WORKDIR /app

# 1. Instala dependências
COPY package*.json ./
RUN npm install

# 2. Copia código e faz build de produção
COPY . .
RUN npm run build:prod

# --- Imagem final: Nginx servindo os arquivos estáticos ---
FROM nginx:alpine
COPY --from=builder /app/dist/momesso-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
