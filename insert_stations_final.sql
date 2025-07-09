-- Insertar 20 estaciones para el sistema AEO1
-- Las estaciones tendrán IDs del 1 al 20

-- Nota: Usar el enum exacto de StationType
INSERT INTO station (
  id, 
  name, 
  location, 
  type, 
  description, 
  "minimumStaff", 
  "maximumStaff", 
  "isActive", 
  "requiredCertifications", 
  code,
  "createdAt",
  "updatedAt"
) VALUES 
-- Estaciones de Terminal
(1, 'Terminal A - Puerta 1', 'Terminal A, Ala Norte', 'TERMINAL', 'Puerta de embarque para vuelos domésticos', 3, 8, true, '{}', 'TA-G1', NOW(), NOW()),
(2, 'Terminal A - Puerta 2', 'Terminal A, Ala Norte', 'TERMINAL', 'Puerta de embarque para vuelos domésticos', 3, 8, true, '{}', 'TA-G2', NOW(), NOW()),
(3, 'Terminal A - Puerta 3', 'Terminal A, Ala Sur', 'TERMINAL', 'Puerta de embarque para vuelos internacionales', 4, 10, true, '{}', 'TA-G3', NOW(), NOW()),
(4, 'Terminal A - Puerta 4', 'Terminal A, Ala Sur', 'TERMINAL', 'Puerta de embarque para vuelos internacionales', 4, 10, true, '{}', 'TA-G4', NOW(), NOW()),
(5, 'Terminal B - Puerta 1', 'Terminal B, Ala Este', 'TERMINAL', 'Puerta principal para vuelos de carga', 3, 7, true, '{}', 'TB-G1', NOW(), NOW()),

-- Estaciones de Plataforma
(6, 'Plataforma 1', 'Área de Tarmac Norte', 'PLATFORM', 'Plataforma de operaciones aéreas', 5, 12, true, '{"ground_operations", "safety_certification"}', 'PLAT-1', NOW(), NOW()),
(7, 'Plataforma 2', 'Área de Tarmac Sur', 'PLATFORM', 'Plataforma de operaciones aéreas', 5, 12, true, '{"ground_operations", "safety_certification"}', 'PLAT-2', NOW(), NOW()),
(8, 'Plataforma 3', 'Área de Tarmac Este', 'PLATFORM', 'Plataforma para aeronaves pesadas', 6, 15, true, '{"ground_operations", "heavy_aircraft_cert"}', 'PLAT-3', NOW(), NOW()),

-- Estaciones de Carga
(9, 'Terminal de Carga A', 'Zona de Carga Norte', 'CARGO', 'Procesamiento de carga aérea nacional', 4, 10, true, '{"cargo_handling", "forklift_license"}', 'CARGO-A', NOW(), NOW()),
(10, 'Terminal de Carga B', 'Zona de Carga Sur', 'CARGO', 'Procesamiento de carga aérea internacional', 5, 12, true, '{"cargo_handling", "customs_clearance"}', 'CARGO-B', NOW(), NOW()),
(11, 'Depósito de Carga', 'Zona de Almacenamiento', 'CARGO', 'Almacenamiento temporal de mercancías', 3, 8, true, '{"warehouse_operations"}', 'DEPOT-1', NOW(), NOW()),

-- Estaciones de Mantenimiento
(12, 'Hangar de Mantenimiento 1', 'Área Técnica Norte', 'MAINTENANCE', 'Mantenimiento preventivo de aeronaves', 6, 15, true, '{"aircraft_maintenance", "electrical_cert"}', 'MAINT-1', NOW(), NOW()),
(13, 'Hangar de Mantenimiento 2', 'Área Técnica Sur', 'MAINTENANCE', 'Reparaciones mayores de aeronaves', 8, 20, true, '{"aircraft_maintenance", "mechanical_cert"}', 'MAINT-2', NOW(), NOW()),
(14, 'Taller de Componentes', 'Área Técnica Este', 'MAINTENANCE', 'Reparación de componentes electrónicos', 4, 10, true, '{"electronics_repair", "component_cert"}', 'COMP-1', NOW(), NOW()),

-- Estaciones de Combustible
(15, 'Estación de Combustible 1', 'Área de Servicios Norte', 'FUEL', 'Suministro de combustible para aeronaves', 3, 8, true, '{"fuel_handling", "hazmat_cert"}', 'FUEL-1', NOW(), NOW()),
(16, 'Estación de Combustible 2', 'Área de Servicios Sur', 'FUEL', 'Suministro de combustible para aeronaves', 3, 8, true, '{"fuel_handling", "hazmat_cert"}', 'FUEL-2', NOW(), NOW()),

-- Estaciones de Seguridad
(17, 'Checkpoint de Seguridad A', 'Terminal A, Entrada Principal', 'SECURITY', 'Control de seguridad de pasajeros', 6, 15, true, '{"security_clearance", "x_ray_cert"}', 'SEC-A', NOW(), NOW()),
(18, 'Checkpoint de Seguridad B', 'Terminal B, Entrada Principal', 'SECURITY', 'Control de seguridad de pasajeros', 6, 15, true, '{"security_clearance", "x_ray_cert"}', 'SEC-B', NOW(), NOW()),
(19, 'Control de Equipajes', 'Área de Equipajes', 'SECURITY', 'Inspección de equipajes de bodega', 4, 10, true, '{"baggage_screening", "security_clearance"}', 'BAG-1', NOW(), NOW()),
(20, 'Torre de Control', 'Torre de Control Principal', 'SECURITY', 'Control de tráfico aéreo', 2, 5, true, '{"atc_license", "radar_cert"}', 'TOWER-1', NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  "minimumStaff" = EXCLUDED."minimumStaff",
  "maximumStaff" = EXCLUDED."maximumStaff",
  "isActive" = EXCLUDED."isActive",
  "requiredCertifications" = EXCLUDED."requiredCertifications",
  code = EXCLUDED.code,
  "updatedAt" = NOW();

-- Reiniciar la secuencia para que los próximos IDs continúen desde 21
SELECT setval('station_id_seq', 20, true);

-- Verificar la inserción
SELECT COUNT(*) as total_stations FROM station;
SELECT id, name, type, code, "minimumStaff", "maximumStaff" FROM station ORDER BY id;
