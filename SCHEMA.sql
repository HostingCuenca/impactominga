-- =====================================================
-- IMPACTO MINGA - DATABASE SCHEMA
-- PostgreSQL 14+
-- Fecha: 2025-10-24
-- =====================================================

-- =====================================================
-- ELIMINACIÓN SEGURA (Solo para desarrollo)
-- =====================================================

-- Descomentar solo si necesitas resetear la BD completamente
-- DROP TABLE IF EXISTS status_history CASCADE;
-- DROP TABLE IF EXISTS receipt_items CASCADE;
-- DROP TABLE IF EXISTS receipts CASCADE;
-- DROP TABLE IF EXISTS tickets CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS pricing_packages CASCADE;
-- DROP TABLE IF EXISTS prizes CASCADE;
-- DROP TABLE IF EXISTS raffle_images CASCADE;
-- DROP TABLE IF EXISTS raffles CASCADE;
-- DROP TABLE IF EXISTS addresses CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS user_status CASCADE;
-- DROP TYPE IF EXISTS order_status CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS raffle_status CASCADE;
-- DROP TYPE IF EXISTS prize_status CASCADE;
-- DROP TYPE IF EXISTS ticket_status CASCADE;
-- DROP TYPE IF EXISTS receipt_status CASCADE;

-- =====================================================
-- 1. TIPOS ENUM
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'contadora',
  'customer'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

CREATE TYPE order_status AS ENUM (
  'pending_payment',        -- Orden creada, esperando pago
  'pending_verification',   -- Cliente reportó pago, esperando verificación
  'approved',               -- Pago verificado y aprobado
  'completed',              -- Números asignados, comprobante enviado
  'rejected',               -- Pago rechazado
  'cancelled'               -- Orden cancelada
);

CREATE TYPE payment_method AS ENUM (
  'bank_transfer',
  'cash',
  'credit_card',
  'debit_card'
);

CREATE TYPE raffle_status AS ENUM (
  'draft',      -- Borrador
  'active',     -- Activo, aceptando compras
  'completed',  -- Finalizado, sorteo realizado
  'cancelled'   -- Cancelado
);

CREATE TYPE prize_status AS ENUM (
  'locked',     -- Bloqueado, no alcanzado
  'unlocked',   -- Desbloqueado, alcanzado
  'claimed'     -- Reclamado por ganador
);

CREATE TYPE ticket_status AS ENUM (
  'available',  -- Disponible para venta
  'reserved',   -- Reservado temporalmente
  'sold'        -- Vendido
);

CREATE TYPE receipt_status AS ENUM (
  'issued',     -- Emitido
  'sent',       -- Enviado por email
  'voided'      -- Anulado
);

-- =====================================================
-- 2. TABLA: users
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Autenticación
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  status user_status NOT NULL DEFAULT 'active',

  -- Información personal
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),

  -- Documento de identidad (OBLIGATORIO para comprobantes)
  id_type VARCHAR(10) NOT NULL CHECK (id_type IN ('cedula', 'ruc', 'passport')),
  id_number VARCHAR(20) NOT NULL,

  -- Verificación
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,

  -- Último acceso
  last_login_at TIMESTAMP,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_id_number ON users(id_number);
CREATE INDEX idx_users_active ON users(email, status) WHERE status = 'active' AND deleted_at IS NULL;

COMMENT ON TABLE users IS 'Usuarios del sistema: super_admin, admin, contadora, customer';
COMMENT ON COLUMN users.id_type IS 'Tipo de documento: cedula, ruc, passport';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp';

-- =====================================================
-- 3. TABLA: addresses
-- =====================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Dirección
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10),

  -- Referencia adicional
  reference TEXT,

  -- Default
  is_default BOOLEAN DEFAULT FALSE,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = TRUE;

COMMENT ON TABLE addresses IS 'Direcciones de entrega de usuarios';
COMMENT ON COLUMN addresses.reference IS 'Referencia para encontrar la dirección (ej: Frente al parque)';

-- =====================================================
-- 4. TABLA: raffles
-- =====================================================

CREATE TABLE raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Info básica
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,

  -- Configuración
  status raffle_status NOT NULL DEFAULT 'draft',
  activity_number INTEGER UNIQUE,

  -- Boletos
  total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
  ticket_price DECIMAL(10,2) NOT NULL CHECK (ticket_price > 0),

  -- Impuestos
  price_includes_tax BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL(5,2) DEFAULT 12.00,

  -- Límites de compra
  min_purchase INTEGER DEFAULT 1,
  max_purchase INTEGER DEFAULT 100,

  -- Fechas
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  draw_date TIMESTAMP,

  -- Banner principal
  banner_url VARCHAR(500),
  banner_alt_text VARCHAR(255),

  -- Premio entregado
  prize_delivered BOOLEAN DEFAULT FALSE,
  prize_delivered_at TIMESTAMP,
  delivery_notes TEXT,

  -- Destacado
  featured BOOLEAN DEFAULT FALSE,

  -- Creador
  created_by UUID REFERENCES users(id),

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_purchase_limits CHECK (max_purchase IS NULL OR max_purchase >= min_purchase)
);

CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_slug ON raffles(slug);
CREATE INDEX idx_raffles_activity_number ON raffles(activity_number);
CREATE INDEX idx_raffles_featured ON raffles(featured, status) WHERE featured = TRUE;
CREATE INDEX idx_raffles_active ON raffles(status, start_date, end_date) WHERE status = 'active' AND deleted_at IS NULL;

COMMENT ON TABLE raffles IS 'Sorteos/Rifas configurables';
COMMENT ON COLUMN raffles.price_includes_tax IS 'Si TRUE, el precio mostrado incluye impuestos';
COMMENT ON COLUMN raffles.activity_number IS 'Número secuencial de actividad (ej: #39)';
COMMENT ON COLUMN raffles.prize_delivered IS 'Indica si el premio fue entregado al ganador';

-- =====================================================
-- 5. TABLA: raffle_images
-- =====================================================

CREATE TABLE raffle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,

  -- Imagen
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  caption TEXT,

  -- Orden
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_raffle_images_raffle ON raffle_images(raffle_id, display_order);
CREATE INDEX idx_raffle_images_primary ON raffle_images(raffle_id, is_primary) WHERE is_primary = TRUE;

COMMENT ON TABLE raffle_images IS 'Galería de imágenes por sorteo';
COMMENT ON COLUMN raffle_images.is_primary IS 'Imagen principal del sorteo';

-- =====================================================
-- 6. TABLA: pricing_packages (NUEVA)
-- =====================================================

CREATE TABLE pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,

  -- Configuración del paquete
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),

  -- Destacado
  is_most_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Orden
  display_order INTEGER DEFAULT 0,

  -- Descuento (opcional para futuro)
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  original_price DECIMAL(10,2),

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_packages_raffle ON pricing_packages(raffle_id, display_order);
CREATE INDEX idx_pricing_packages_active ON pricing_packages(raffle_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE pricing_packages IS 'Paquetes de precios configurables por sorteo (ej: 5, 10, 15 boletos)';
COMMENT ON COLUMN pricing_packages.is_most_popular IS 'Destacar como "MÁS VENDIDO" en el frontend';

-- =====================================================
-- 7. TABLA: prizes
-- =====================================================

CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,

  -- Información del premio
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Valor (efectivo o producto)
  cash_value DECIMAL(10,2),
  product_name VARCHAR(255),
  product_description TEXT,
  product_image_url VARCHAR(500),

  -- Condición de desbloqueo
  unlock_at_percentage DECIMAL(5,2) CHECK (unlock_at_percentage >= 0 AND unlock_at_percentage <= 100),
  unlock_at_tickets_sold INTEGER,

  -- Estado
  status prize_status DEFAULT 'locked',
  unlocked_at TIMESTAMP,

  -- Ganador
  winner_ticket_id UUID,
  claimed_at TIMESTAMP,

  -- Display
  display_order INTEGER DEFAULT 0,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT prize_type_check CHECK (
    (cash_value IS NOT NULL AND product_name IS NULL) OR
    (cash_value IS NULL AND product_name IS NOT NULL)
  ),
  CONSTRAINT unlock_condition_check CHECK (
    unlock_at_percentage IS NOT NULL OR unlock_at_tickets_sold IS NOT NULL
  )
);

CREATE INDEX idx_prizes_raffle ON prizes(raffle_id, display_order);
CREATE INDEX idx_prizes_status ON prizes(raffle_id, status);
CREATE INDEX idx_prizes_unlock_pct ON prizes(raffle_id, unlock_at_percentage);

COMMENT ON TABLE prizes IS 'Premios progresivos por sorteo';
COMMENT ON COLUMN prizes.unlock_at_percentage IS 'Porcentaje de venta para desbloquear (ej: 50.00 = 50%)';

-- =====================================================
-- 8. TABLA: orders
-- =====================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Número de orden/referencia
  order_number VARCHAR(50) UNIQUE NOT NULL,

  -- Cliente
  user_id UUID NOT NULL REFERENCES users(id),

  -- Snapshot de datos del cliente (para comprobante)
  customer_email VARCHAR(255) NOT NULL,
  customer_first_name VARCHAR(100) NOT NULL,
  customer_last_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_id_type VARCHAR(10) NOT NULL,
  customer_id_number VARCHAR(20) NOT NULL,

  -- Dirección (snapshot)
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_province VARCHAR(100),

  -- Montos
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,

  -- Estado
  status order_status NOT NULL DEFAULT 'pending_payment',

  -- Información de pago
  payment_method payment_method DEFAULT 'bank_transfer',
  payment_reference VARCHAR(255),
  bank_account_used VARCHAR(100),

  -- Notas
  customer_notes TEXT,
  admin_notes TEXT,

  -- Aprobación
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Rechazo
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_pending ON orders(status) WHERE status IN ('pending_verification', 'approved');

COMMENT ON TABLE orders IS 'Órdenes de compra de boletos';
COMMENT ON COLUMN orders.order_number IS 'Número de referencia para transferencia bancaria (ej: PF-12345678)';
COMMENT ON COLUMN orders.payment_reference IS 'Código de referencia de la transferencia bancaria';

-- =====================================================
-- 9. TABLA: order_items
-- =====================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  raffle_id UUID NOT NULL REFERENCES raffles(id),

  -- Snapshot del sorteo
  raffle_title VARCHAR(255) NOT NULL,
  raffle_activity_number INTEGER,

  -- Cantidad
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_raffle ON order_items(raffle_id);

COMMENT ON TABLE order_items IS 'Items individuales de cada orden';

-- =====================================================
-- 10. TABLA: tickets
-- =====================================================

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,

  -- Número del boleto
  ticket_number INTEGER NOT NULL,

  -- Asignación
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),

  -- Estado
  status ticket_status NOT NULL DEFAULT 'available',

  -- Reserva temporal
  reserved_until TIMESTAMP,

  -- Compra
  assigned_at TIMESTAMP,

  -- Ganador
  is_winner BOOLEAN DEFAULT FALSE,
  won_prize_id UUID REFERENCES prizes(id),

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraint único
  UNIQUE(raffle_id, ticket_number)
);

CREATE INDEX idx_tickets_raffle ON tickets(raffle_id);
CREATE INDEX idx_tickets_status ON tickets(raffle_id, status);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_number ON tickets(raffle_id, ticket_number);
CREATE INDEX idx_tickets_available ON tickets(raffle_id, status) WHERE status = 'available';
CREATE INDEX idx_tickets_winner ON tickets(is_winner, raffle_id) WHERE is_winner = TRUE;

COMMENT ON TABLE tickets IS 'Boletos individuales de cada sorteo';
COMMENT ON COLUMN tickets.reserved_until IS 'Reserva temporal durante checkout (15-30 min)';
COMMENT ON COLUMN tickets.assigned_at IS 'Cuándo se asignó al usuario (al aprobar orden)';

-- =====================================================
-- 11. TABLA: receipts
-- =====================================================

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),

  -- Numeración secuencial
  receipt_number VARCHAR(50) UNIQUE NOT NULL,

  -- Snapshot de datos del cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_id_type VARCHAR(10) NOT NULL,
  customer_id_number VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT,

  -- Montos
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,

  -- Método de pago
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),

  -- Estado
  status receipt_status NOT NULL DEFAULT 'issued',

  -- Archivo PDF
  pdf_url VARCHAR(500),

  -- Emisión
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  issued_by UUID REFERENCES users(id),

  -- Envío por email
  sent_at TIMESTAMP,

  -- Anulación
  voided_at TIMESTAMP,
  voided_by UUID REFERENCES users(id),
  void_reason TEXT,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipts_order ON receipts(order_id);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_customer_email ON receipts(customer_email);
CREATE INDEX idx_receipts_issued_at ON receipts(issued_at DESC);

COMMENT ON TABLE receipts IS 'Comprobantes de compra';
COMMENT ON COLUMN receipts.receipt_number IS 'Número secuencial (ej: 000001, 000002...)';

-- =====================================================
-- 12. TABLA: receipt_items
-- =====================================================

CREATE TABLE receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,

  -- Descripción
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,

  -- Números asignados
  ticket_numbers TEXT,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);

COMMENT ON TABLE receipt_items IS 'Detalle de items en el comprobante';
COMMENT ON COLUMN receipt_items.ticket_numbers IS 'Lista de números asignados (ej: "001, 045, 123, 456, 789")';

-- =====================================================
-- 13. TABLA: system_settings
-- =====================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clave-Valor
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),

  -- Auditoría
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

COMMENT ON TABLE system_settings IS 'Configuración del sistema';

-- =====================================================
-- 14. TABLA: password_reset_tokens
-- =====================================================

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);

COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperación de contraseña (expiran en 1 hora)';

-- =====================================================
-- 15. TABLA: status_history
-- =====================================================

CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entidad relacionada
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  -- Cambio de estado
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,

  -- Contexto
  changed_by UUID REFERENCES users(id),
  notes TEXT,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX idx_status_history_created ON status_history(created_at DESC);

COMMENT ON TABLE status_history IS 'Auditoría de cambios de estado';

-- =====================================================
-- 15. DATOS INICIALES
-- =====================================================

-- Configuración del sistema
INSERT INTO system_settings (key, value, description, category) VALUES
  ('tax_rate', '12.00', 'Tasa de IVA (%)', 'payment'),
  ('whatsapp_number', '593987654321', 'Número de WhatsApp para contacto', 'contact'),
  ('whatsapp_message_template', 'Hola, necesito ayuda con mi orden {order_number}', 'Plantilla de mensaje WhatsApp', 'contact'),
  ('bank_account_1', '{"bank":"Banco Pichincha","account":"2100123456","type":"Ahorros","holder":"Impacto Minga"}', 'Cuenta bancaria principal', 'payment'),
  ('receipt_counter', '0', 'Contador de comprobantes', 'receipts'),
  ('company_name', 'Impacto Minga', 'Nombre de la empresa', 'company'),
  ('company_address', 'Ecuador', 'Dirección de la empresa', 'company'),
  ('company_phone', '099-999-9999', 'Teléfono de contacto', 'company'),
  ('company_email', 'info@impactominga.com', 'Email de contacto', 'company'),
  ('tutorial_video_url', 'https://youtube.com/watch?v=example', 'URL del video tutorial de compra', 'content'),
  ('reservation_minutes', '15', 'Minutos de reserva de boletos durante checkout', 'raffle');

-- Usuario super admin inicial (password: admin123 - CAMBIAR EN PRODUCCIÓN)
-- Hash generado con bcrypt: $2b$10$rOZ9V9V9V9V9V9V9V9V9V.EXAMPLE
INSERT INTO users (email, password_hash, role, first_name, last_name, id_type, id_number, email_verified, status)
VALUES (
  'admin@impactominga.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password" - CAMBIAR!
  'super_admin',
  'Super',
  'Admin',
  'cedula',
  '0000000000',
  TRUE,
  'active'
);

-- =====================================================
-- 16. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raffle_images_updated_at BEFORE UPDATE ON raffle_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_packages_updated_at BEFORE UPDATE ON pricing_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función: Verificar desbloqueo de premios
CREATE OR REPLACE FUNCTION check_prize_unlock()
RETURNS TRIGGER AS $$
DECLARE
  sold_count INTEGER;
  sold_pct DECIMAL(5,2);
  total_tickets INTEGER;
BEGIN
  -- Obtener total de tickets del sorteo
  SELECT r.total_tickets INTO total_tickets
  FROM raffles r
  WHERE r.id = NEW.raffle_id;

  -- Calcular boletos vendidos
  SELECT COUNT(*) INTO sold_count
  FROM tickets
  WHERE raffle_id = NEW.raffle_id AND status = 'sold';

  -- Calcular porcentaje
  sold_pct := (sold_count::DECIMAL / total_tickets * 100);

  -- Desbloquear premios elegibles
  UPDATE prizes
  SET status = 'unlocked', unlocked_at = CURRENT_TIMESTAMP
  WHERE raffle_id = NEW.raffle_id
    AND status = 'locked'
    AND (
      (unlock_at_percentage IS NOT NULL AND sold_pct >= unlock_at_percentage)
      OR (unlock_at_tickets_sold IS NOT NULL AND sold_count >= unlock_at_tickets_sold)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Desbloquear premios al vender boleto
CREATE TRIGGER trigger_check_prize_unlock
AFTER UPDATE OF status ON tickets
FOR EACH ROW
WHEN (NEW.status = 'sold' AND OLD.status != 'sold')
EXECUTE FUNCTION check_prize_unlock();

-- Función: Registrar cambios de estado
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_history (entity_type, entity_id, old_status, new_status)
    VALUES (TG_TABLE_NAME, NEW.id, OLD.status::TEXT, NEW.status::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Log cambios de estado en orders
CREATE TRIGGER log_order_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_status_change();

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

-- Verificar instalación
SELECT 'Schema creado exitosamente!' as message;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
