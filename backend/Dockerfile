FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências (camada cacheada pelo Docker)
COPY package*.json ./
RUN npm install

# Copia código-fonte e compila TypeScript -> JavaScript
COPY . .
RUN npm run build

# --- Imagem final (produção, sem devDependencies) ---
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]
