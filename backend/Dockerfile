FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm ci --only=production=false

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine

WORKDIR /app

# Copiar solo las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar la aplicación construida
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
