
-- Insertar 20 estaciones para testing
INSERT INTO station (id, name, type, location, capacity, required_staff, created_at, updated_at) VALUES
(1, 'Terminal A - Gate 1', 'gate', 'Terminal A', 150, 8, NOW(), NOW()),
(2, 'Terminal A - Gate 2', 'gate', 'Terminal A', 150, 8, NOW(), NOW()),
(3, 'Terminal A - Gate 3', 'gate', 'Terminal A', 150, 8, NOW(), NOW()),
(4, 'Terminal A - Gate 4', 'gate', 'Terminal A', 150, 8, NOW(), NOW()),
(5, 'Terminal A - Gate 5', 'gate', 'Terminal A', 150, 8, NOW(), NOW()),
(6, 'Terminal B - Gate 1', 'gate', 'Terminal B', 200, 10, NOW(), NOW()),
(7, 'Terminal B - Gate 2', 'gate', 'Terminal B', 200, 10, NOW(), NOW()),
(8, 'Terminal B - Gate 3', 'gate', 'Terminal B', 200, 10, NOW(), NOW()),
(9, 'Terminal B - Gate 4', 'gate', 'Terminal B', 200, 10, NOW(), NOW()),
(10, 'Terminal B - Gate 5', 'gate', 'Terminal B', 200, 10, NOW(), NOW()),
(11, 'Baggage Claim 1', 'baggage', 'Arrivals Hall', 100, 6, NOW(), NOW()),
(12, 'Baggage Claim 2', 'baggage', 'Arrivals Hall', 100, 6, NOW(), NOW()),
(13, 'Baggage Claim 3', 'baggage', 'Arrivals Hall', 100, 6, NOW(), NOW()),
(14, 'Security Checkpoint 1', 'security', 'Security Area', 80, 12, NOW(), NOW()),
(15, 'Security Checkpoint 2', 'security', 'Security Area', 80, 12, NOW(), NOW()),
(16, 'Security Checkpoint 3', 'security', 'Security Area', 80, 12, NOW(), NOW()),
(17, 'Ground Operations', 'ground', 'Tarmac Area', 50, 15, NOW(), NOW()),
(18, 'Maintenance Hub', 'maintenance', 'Technical Area', 30, 8, NOW(), NOW()),
(19, 'Customer Service', 'service', 'Main Hall', 40, 5, NOW(), NOW()),
(20, 'Control Tower', 'control', 'Tower', 20, 4, NOW(), NOW());

