#!/bin/bash

# Script para configurar la base de datos AEO1 con estaciones y usuarios

echo "🚀 Configurando base de datos AEO1..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables de conexión a la base de datos (ajustar según sea necesario)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-aeo1}
DB_USER=${DB_USER:-postgres}

# Verificar si psql está disponible
if ! command -v psql &> /dev/null; then
    print_error "psql no está instalado o no está en el PATH"
    exit 1
fi

# Verificar archivos SQL
if [ ! -f "insert_stations_final.sql" ]; then
    print_error "Archivo insert_stations_final.sql no encontrado"
    exit 1
fi

if [ ! -f "insert_users_final.sql" ]; then
    print_error "Archivo insert_users_final.sql no encontrado"
    exit 1
fi

print_status "Insertando 20 estaciones..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f insert_stations_final.sql; then
    print_success "Estaciones insertadas exitosamente"
else
    print_error "Error al insertar estaciones"
    exit 1
fi

echo ""
print_status "Insertando 20 usuarios..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f insert_users_final.sql; then
    print_success "Usuarios insertados exitosamente"
else
    print_error "Error al insertar usuarios"
    exit 1
fi

echo ""
print_status "Verificando datos insertados..."

# Verificar estaciones
STATION_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM station;")
print_status "Total de estaciones en BD: $STATION_COUNT"

# Verificar usuarios
USER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;")
print_status "Total de usuarios en BD: $USER_COUNT"

# Mostrar resumen por estación
echo ""
print_status "Resumen de personal por estación:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
  s.id as \"ID\",
  s.name as \"Estación\",
  s.code as \"Código\",
  COUNT(u.id) as \"Personal\",
  s.\"minimumStaff\" as \"Mín\",
  s.\"maximumStaff\" as \"Máx\"
FROM station s
LEFT JOIN users u ON s.id = u.\"stationId\" 
GROUP BY s.id, s.name, s.code, s.\"minimumStaff\", s.\"maximumStaff\"
ORDER BY s.id;
"

# Verificar usuarios por rol
echo ""
print_status "Usuarios por rol:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
  role as \"Rol\",
  COUNT(*) as \"Cantidad\"
FROM users 
GROUP BY role 
ORDER BY role;
"

print_success "✅ Configuración de base de datos completada"
print_warning "📋 Credenciales de acceso:"
echo "   - Admin: carlos.admin@aeo1.com / [password configured in env]"
echo "   - Admin: ana.admin@aeo1.com / [password configured in env]" 
echo "   - President: roberto.president@aeo1.com / [password configured in env]"
echo "   - Managers: luis.manager@aeo1.com, carmen.manager@aeo1.com, etc. / [password configured in env]"
echo "   - Supervisors y Employees: ver emails en la BD / [password configured in env]"

echo ""
print_status "🎯 Próximos pasos:"
echo "   1. Iniciar el backend: cd backend && npm run start:dev"
echo "   2. Iniciar el frontend: cd frontend && npm run dev"
echo "   3. Probar login con cualquiera de las credenciales mostradas"
echo "   4. Verificar asignaciones de estaciones en la sección 'Programación'"
