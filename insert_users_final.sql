-- Insertar 20 empleados para el sistema AEO1
-- Las contraseñas están hasheadas usando bcrypt (salt rounds: 10)
-- Contraseña configurada desde variables de entorno

INSERT INTO users (
  id,
  name,
  email,
  password,
  role,
  phone,
  address,
  "birthDate",
  "emergencyContact",
  "emergencyPhone",
  certifications,
  skills,
  categories,
  "availableShifts",
  "maxWeeklyHours",
  "maxDailyHours",
  "isActive",
  "isAvailable",
  "stationId",
  "supervisorId",
  "createdAt",
  "updatedAt"
) VALUES 
-- Administradores (2)
(1, 'Carlos Rodríguez', 'carlos.admin@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'ADMIN', '+1-809-555-0001', 'Av. Principal #123, Santo Domingo', '1980-03-15', 'María Rodríguez', '+1-809-555-1001', '{"system_admin", "security_clearance", "management_cert"}', '{"leadership", "problem_solving", "communication"}', '{"SUPERVISOR", "MANAGER"}', '{"morning", "afternoon", "night"}', 50, 12, true, true, NULL, NULL, NOW(), NOW()),

(2, 'Ana Martínez', 'ana.admin@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'ADMIN', '+1-809-555-0002', 'Calle 27 de Febrero #456, Santo Domingo', '1985-07-22', 'Pedro Martínez', '+1-809-555-1002', '{"system_admin", "security_clearance", "hr_management"}', '{"leadership", "strategic_planning", "hr_management"}', '{"MANAGER"}', '{"morning", "afternoon"}', 45, 10, true, true, NULL, NULL, NOW(), NOW()),

-- Presidentes/Ejecutivos (1)
(3, 'Roberto Pérez', 'roberto.president@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'PRESIDENT', '+1-809-555-0003', 'Av. Abraham Lincoln #789, Santo Domingo', '1975-11-08', 'Carmen Pérez', '+1-809-555-1003', '{"executive_leadership", "aviation_management"}', '{"strategic_vision", "executive_leadership", "aviation_expertise"}', '{"MANAGER"}', '{"morning", "afternoon"}', 40, 8, true, true, NULL, NULL, NOW(), NOW()),

-- Gerentes por estación (6)
(4, 'Luis García', 'luis.manager@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'MANAGER', '+1-809-555-0004', 'Calle Mercedes #321, Santo Domingo', '1982-05-18', 'Elena García', '+1-809-555-1004', '{"management_cert", "terminal_operations"}', '{"team_management", "terminal_operations", "customer_service"}', '{"SUPERVISOR"}', '{"morning", "afternoon", "night"}', 48, 10, true, true, 1, 2, NOW(), NOW()),

(5, 'Carmen López', 'carmen.manager@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'MANAGER', '+1-809-555-0005', 'Av. Independencia #654, Santo Domingo', '1984-09-12', 'Miguel López', '+1-809-555-1005', '{"management_cert", "ground_operations"}', '{"team_leadership", "ground_operations", "safety_management"}', '{"SUPERVISOR"}', '{"morning", "afternoon", "night"}', 48, 10, true, true, 6, 1, NOW(), NOW()),

(6, 'Fernando Silva', 'fernando.manager@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'MANAGER', '+1-809-555-0006', 'Calle El Conde #987, Santo Domingo', '1981-02-25', 'Patricia Silva', '+1-809-555-1006', '{"management_cert", "cargo_handling", "customs_clearance"}', '{"cargo_operations", "logistics", "customs_procedures"}', '{"SUPERVISOR"}', '{"morning", "afternoon", "night"}', 48, 10, true, true, 9, 1, NOW(), NOW()),

(7, 'Mónica Jiménez', 'monica.manager@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'MANAGER', '+1-809-555-0007', 'Av. Máximo Gómez #147, Santo Domingo', '1983-12-03', 'Ricardo Jiménez', '+1-809-555-1007', '{"management_cert", "aircraft_maintenance", "mechanical_cert"}', '{"maintenance_management", "technical_expertise", "safety_protocols"}', '{"SUPERVISOR"}', '{"morning", "afternoon", "night"}', 48, 10, true, true, 12, 1, NOW(), NOW()),

(8, 'Diego Morales', 'diego.manager@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'MANAGER', '+1-809-555-0008', 'Calle Duarte #258, Santo Domingo', '1986-06-19', 'Sandra Morales', '+1-809-555-1008', '{"management_cert", "fuel_handling", "hazmat_cert"}', '{"fuel_operations", "safety_management", "environmental_compliance"}', '{"SUPERVISOR"}', '{"morning", "afternoon", "night"}', 48, 10, true, true, 15, 2, NOW(), NOW()),

(9, 'Patricia Herrera', 'patricia.manager@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'MANAGER', '+1-809-555-0009', 'Av. Tiradentes #369, Santo Domingo', '1984-08-14', 'Andrés Herrera', '+1-809-555-1009', '{"management_cert", "security_clearance", "x_ray_cert"}', '{"security_management", "risk_assessment", "emergency_response"}', '{"SUPERVISOR"}', '{"morning", "afternoon", "night"}', 48, 10, true, true, 17, 1, NOW(), NOW()),

-- Supervisores (5)
(10, 'Mario Vásquez', 'mario.supervisor@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'SUPERVISOR', '+1-809-555-0010', 'Calle Las Mercedes #741, Santo Domingo', '1988-04-07', 'Laura Vásquez', '+1-809-555-1010', '{"supervisor_cert", "terminal_operations", "customer_service"}', '{"team_coordination", "problem_solving", "multitasking"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 44, 9, true, true, 2, 4, NOW(), NOW()),

(11, 'Sofía Ramírez', 'sofia.supervisor@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'SUPERVISOR', '+1-809-555-0011', 'Av. Venezuela #852, Santo Domingo', '1987-10-30', 'Carlos Ramírez', '+1-809-555-1011', '{"supervisor_cert", "ground_operations", "safety_certification"}', '{"safety_management", "equipment_operation", "training"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 44, 9, true, true, 7, 5, NOW(), NOW()),

(12, 'Alejandro Cruz', 'alejandro.supervisor@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'SUPERVISOR', '+1-809-555-0012', 'Calle Mella #963, Santo Domingo', '1989-01-16', 'Yolanda Cruz', '+1-809-555-1012', '{"supervisor_cert", "cargo_handling", "forklift_license"}', '{"logistics_coordination", "inventory_management", "quality_control"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 44, 9, true, true, 10, 6, NOW(), NOW()),

(13, 'Isabella Torres', 'isabella.supervisor@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'SUPERVISOR', '+1-809-555-0013', 'Av. John F. Kennedy #174, Santo Domingo', '1986-11-29', 'José Torres', '+1-809-555-1013', '{"supervisor_cert", "aircraft_maintenance", "electrical_cert"}', '{"technical_supervision", "quality_assurance", "documentation"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 44, 9, true, true, 13, 7, NOW(), NOW()),

(14, 'Rafael Mendoza', 'rafael.supervisor@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'SUPERVISOR', '+1-809-555-0014', 'Calle Beller #285, Santo Domingo', '1990-03-08', 'Mariela Mendoza', '+1-809-555-1014', '{"supervisor_cert", "security_clearance", "baggage_screening"}', '{"security_protocols", "conflict_resolution", "emergency_procedures"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 44, 9, true, true, 18, 9, NOW(), NOW()),

-- Empleados (6)
(15, 'Juan Pablo Castro', 'juan.employee@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'EMPLOYEE', '+1-809-555-0015', 'Calle París #396, Santo Domingo', '1992-07-21', 'Ana Castro', '+1-809-555-1015', '{"basic_operations", "customer_service"}', '{"communication", "attention_to_detail", "teamwork"}', '{"EMPLOYEE"}', '{"morning", "afternoon"}', 40, 8, true, true, 3, 10, NOW(), NOW()),

(16, 'Gabriela Núñez', 'gabriela.employee@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'EMPLOYEE', '+1-809-555-0016', 'Av. Rómulo Betancourt #507, Santo Domingo', '1991-12-05', 'Roberto Núñez', '+1-809-555-1016', '{"ground_operations", "safety_certification"}', '{"equipment_operation", "physical_fitness", "attention_to_detail"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 40, 8, true, true, 8, 11, NOW(), NOW()),

(17, 'Andrés Santana', 'andres.employee@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'EMPLOYEE', '+1-809-555-0017', 'Calle Santiago #618, Santo Domingo', '1993-05-17', 'Carla Santana', '+1-809-555-1017', '{"cargo_handling", "warehouse_operations"}', '{"physical_strength", "organization", "time_management"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 40, 8, true, true, 11, 12, NOW(), NOW()),

(18, 'Valeria Soto', 'valeria.employee@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'EMPLOYEE', '+1-809-555-0018', 'Av. San Martín #729, Santo Domingo', '1994-09-23', 'Fernando Soto', '+1-809-555-1018', '{"electronics_repair", "component_cert"}', '{"technical_skills", "precision", "analytical_thinking"}', '{"EMPLOYEE"}', '{"morning", "afternoon"}', 40, 8, true, true, 14, 13, NOW(), NOW()),

(19, 'Ricardo Peña', 'ricardo.employee@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'EMPLOYEE', '+1-809-555-0019', 'Calle Estrelleta #840, Santo Domingo', '1992-02-11', 'Diana Peña', '+1-809-555-1019', '{"fuel_handling", "hazmat_cert"}', '{"safety_awareness", "attention_to_detail", "emergency_response"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 40, 8, true, true, 16, 8, NOW(), NOW()),

(20, 'Lucía Moreno', 'lucia.employee@aeo1.com', '$2b$10$rOz8kqQJNhGJ8M.YzRGpg.7kgN6nJx5zBHnKQcNpO4mZ2H1L3uR4O', 'EMPLOYEE', '+1-809-555-0020', 'Av. Bolívar #951, Santo Domingo', '1995-06-28', 'Héctor Moreno', '+1-809-555-1020', '{"x_ray_cert", "security_clearance"}', '{"observation_skills", "protocol_adherence", "calm_under_pressure"}', '{"EMPLOYEE"}', '{"morning", "afternoon", "night"}', 40, 8, true, true, 19, 14, NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  "birthDate" = EXCLUDED."birthDate",
  "emergencyContact" = EXCLUDED."emergencyContact",
  "emergencyPhone" = EXCLUDED."emergencyPhone",
  certifications = EXCLUDED.certifications,
  skills = EXCLUDED.skills,
  categories = EXCLUDED.categories,
  "availableShifts" = EXCLUDED."availableShifts",
  "maxWeeklyHours" = EXCLUDED."maxWeeklyHours",
  "maxDailyHours" = EXCLUDED."maxDailyHours",
  "isActive" = EXCLUDED."isActive",
  "isAvailable" = EXCLUDED."isAvailable",
  "stationId" = EXCLUDED."stationId",
  "supervisorId" = EXCLUDED."supervisorId",
  "updatedAt" = NOW();

-- Reiniciar la secuencia para que los próximos IDs continúen desde 21
SELECT setval('users_id_seq', 20, true);

-- Verificar la inserción
SELECT COUNT(*) as total_users FROM users;
SELECT id, name, role, email, "stationId", "supervisorId" FROM users ORDER BY id;

-- Resumen por estación
SELECT 
  s.id as station_id,
  s.name as station_name,
  s.code as station_code,
  COUNT(u.id) as assigned_staff,
  s."minimumStaff" as min_required,
  s."maximumStaff" as max_capacity
FROM station s
LEFT JOIN users u ON s.id = u."stationId" 
GROUP BY s.id, s.name, s.code, s."minimumStaff", s."maximumStaff"
ORDER BY s.id;
