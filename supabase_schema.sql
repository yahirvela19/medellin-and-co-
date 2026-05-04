-- =====================================================
-- MEDELLIN & CO. - Supabase SQL Schema
-- Ejecuta este script en el SQL Editor de Supabase
-- =====================================================

-- Tabla: Productos (Inventario)
CREATE TABLE IF NOT EXISTS productos (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  categoria VARCHAR(150),
  sku VARCHAR(100) UNIQUE,
  ubicacion VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(150),
  correo VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id_venta SERIAL PRIMARY KEY,
  id_cliente INT REFERENCES clientes(id_cliente) ON DELETE SET NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  total FLOAT NOT NULL DEFAULT 0
);

-- Tabla: Detalle de Venta
CREATE TABLE IF NOT EXISTS detalle_venta (
  id_detalle SERIAL PRIMARY KEY,
  id_venta INT REFERENCES ventas(id_venta) ON DELETE CASCADE,
  id_producto INT REFERENCES productos(id_producto) ON DELETE SET NULL,
  cantidad INT NOT NULL DEFAULT 1,
  subtotal FLOAT NOT NULL DEFAULT 0
);

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, sku, ubicacion) VALUES
  ('Anillo de Oro 18k', 'Anillo de oro amarillo 18 quilates, talla 7', 4500.00, 12, 'Anillo', 'ANI-001', 'Vitrina A1'),
  ('Collar de Plata', 'Collar de plata 925 con dije de corazón', 1200.00, 25, 'Collar', 'COL-001', 'Vitrina B2'),
  ('Arete de Perla', 'Aretes con perla cultivada natural', 850.00, 18, 'Arete', 'ARE-001', 'Vitrina C1'),
  ('Pulsera de Oro', 'Pulsera eslabón de oro 14k, 18cm', 3200.00, 8, 'Pulsera', 'PUL-001', 'Vitrina A3'),
  ('Dije de Plata', 'Dije corazón de plata con zirconia', 650.00, 30, 'Dije', 'DIJ-001', 'Vitrina D1'),
  ('Anillo de Compromiso', 'Anillo solitario con diamante 0.5ct', 18500.00, 4, 'Anillo', 'ANI-002', 'Caja Fuerte'),
  ('Collar de Diamantes', 'Collar tennis con diamantes naturales', 25000.00, 2, 'Collar', 'COL-002', 'Caja Fuerte'),
  ('Arete de Aro', 'Arete aro de oro amarillo 14k', 2100.00, 15, 'Arete', 'ARE-002', 'Vitrina B1');

INSERT INTO clientes (nombre, telefono, correo) VALUES
  ('Ana García López', '8112345678', 'ana.garcia@email.com'),
  ('Roberto Martínez', '8198765432', 'r.martinez@email.com'),
  ('Laura Sánchez Vega', '8124681357', 'laura.sv@email.com'),
  ('Miguel Torres Cruz', '8119876543', 'miguel.tc@email.com'),
  ('Sofía Ramírez', '8113579246', 'sofia.r@email.com');

INSERT INTO ventas (id_cliente, fecha, total) VALUES
  (1, NOW() - INTERVAL '1 day', 5700.00),
  (2, NOW() - INTERVAL '3 days', 18500.00),
  (3, NOW() - INTERVAL '5 days', 2050.00),
  (4, NOW() - INTERVAL '7 days', 4500.00),
  (5, NOW() - INTERVAL '10 days', 26200.00);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
  (1, 1, 1, 4500.00),
  (1, 5, 1, 650.00),
  (1, 3, 1, 850.00),
  (2, 6, 1, 18500.00),
  (3, 2, 1, 1200.00),
  (3, 5, 1, 650.00),
  (3, 4, 0, 200.00),
  (4, 1, 1, 4500.00),
  (5, 7, 1, 25000.00),
  (5, 5, 1, 650.00),
  (5, 3, 2, 1700.00);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- Habilita para producción, deshabilita para desarrollo
-- =====================================================

-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;
