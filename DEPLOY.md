# Deploy en Render

## Pasos para hacer deploy:

### 1. Configurar Base de Datos en Render
1. Ve a tu dashboard de Render
2. Crea una nueva base de datos PostgreSQL
3. Copia el `DATABASE_URL` que te proporcionen

### 2. Configurar Variables de Entorno
En tu servicio de Render, configura estas variables:

```
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:port/db (de tu BD en Render)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_2024
ODOO_URL=http://tu-odoo-instance.com:8069
ODOO_DATABASE=aeo_odoo
ODOO_USERNAME=admin@aeo1.com
ODOO_PASSWORD=admin123
```

### 3. Deploy del Backend
1. Conecta tu repositorio de GitHub a Render
2. Selecciona "Web Service"
3. Configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Docker (opcional)

### 4. Health Check
Tu aplicación incluye un endpoint de health check en `/health`

### 5. Logs y Monitoreo
- Render automáticamente generará logs
- El endpoint `/health` puede usarse para monitoring
- Swagger estará disponible en `/api`

## Comandos locales útiles:

```bash
# Probar build local
npm run build

# Probar en modo producción
NODE_ENV=production npm start

# Probar con Docker
docker build -t aeo-backend .
docker run -p 3001:3001 --env-file .env aeo-backend
```
