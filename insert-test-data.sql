-- Script para insertar datos de prueba en la base de datos
-- Ejecutar después de haber creado el schema

-- =====================================================
-- 1. CREAR UN SORTEO ACTIVO (Actividad #39)
-- =====================================================
INSERT INTO raffles (
  title,
  description,
  slug,
  status,
  activity_number,
  total_tickets,
  ticket_price,
  price_includes_tax,
  tax_rate,
  min_purchase,
  max_purchase,
  start_date,
  end_date,
  draw_date,
  banner_url,
  thumbnail_url
) VALUES (
  'SORTEO TOYOTA COROLLA 2024',
  'Participa por un increíble Toyota Corolla 2024 0km. Sorteo completamente transparente y verificable. ¡No te lo pierdas!',
  'toyota-corolla-2024',
  'active',
  39,
  10000,
  1.00,
  true,
  12.00,
  1,
  100,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '31 days',
  '/images/raffles/toyota-corolla-banner.jpg',
  '/images/raffles/toyota-corolla-thumb.jpg'
) RETURNING id;

-- Guardar el ID del raffle para usarlo después
-- En PostgreSQL, necesitamos usar una variable temporal o hacer esto en una transacción
-- Para simplicidad, vamos a usar una CTE (Common Table Expression)

WITH raffle AS (
  SELECT id FROM raffles WHERE slug = 'toyota-corolla-2024'
)

-- =====================================================
-- 2. CREAR PAQUETES DE PRECIOS
-- =====================================================
INSERT INTO pricing_packages (raffle_id, quantity, price, is_most_popular, is_active, display_order, discount_percentage, original_price)
SELECT
  raffle.id,
  package_data.quantity,
  package_data.price,
  package_data.is_most_popular,
  package_data.is_active,
  package_data.display_order,
  package_data.discount_percentage,
  package_data.original_price
FROM raffle, (VALUES
  (1, 1.00, false, true, 1, 0, NULL),
  (5, 4.50, false, true, 2, 10, 5.00),
  (10, 8.00, true, true, 3, 20, 10.00),
  (25, 18.75, false, true, 4, 25, 25.00),
  (50, 35.00, false, true, 5, 30, 50.00),
  (100, 65.00, false, true, 6, 35, 100.00)
) AS package_data(quantity, price, is_most_popular, is_active, display_order, discount_percentage, original_price);

-- =====================================================
-- 3. CREAR PREMIOS PROGRESIVOS
-- =====================================================
WITH raffle AS (
  SELECT id FROM raffles WHERE slug = 'toyota-corolla-2024'
)
INSERT INTO prizes (raffle_id, name, description, image_url, unlock_threshold, unlock_status, is_active, display_order)
SELECT
  raffle.id,
  prize_data.name,
  prize_data.description,
  prize_data.image_url,
  prize_data.unlock_threshold,
  prize_data.unlock_status,
  prize_data.is_active,
  prize_data.display_order
FROM raffle, (VALUES
  (
    'Toyota Corolla 2024',
    'Toyota Corolla 2024 0km completamente equipado',
    '/images/prizes/toyota-corolla.jpg',
    8000,
    'locked',
    true,
    1
  ),
  (
    'iPhone 15 Pro Max',
    'iPhone 15 Pro Max 256GB',
    '/images/prizes/iphone-15.jpg',
    5000,
    'locked',
    true,
    2
  ),
  (
    'MacBook Air M3',
    'MacBook Air M3 con 16GB RAM',
    '/images/prizes/macbook-air.jpg',
    3000,
    'locked',
    true,
    3
  ),
  (
    'PlayStation 5',
    'PlayStation 5 + 2 Controles',
    '/images/prizes/ps5.jpg',
    1500,
    'locked',
    true,
    4
  ),
  (
    'Smart TV 65"',
    'Smart TV Samsung 65 pulgadas 4K',
    '/images/prizes/smart-tv.jpg',
    500,
    'unlocked',
    true,
    5
  )
) AS prize_data(name, description, image_url, unlock_threshold, unlock_status, is_active, display_order);

-- =====================================================
-- 4. CREAR IMÁGENES DEL SORTEO (GALERÍA)
-- =====================================================
WITH raffle AS (
  SELECT id FROM raffles WHERE slug = 'toyota-corolla-2024'
)
INSERT INTO raffle_images (raffle_id, image_url, caption, display_order, is_active)
SELECT
  raffle.id,
  image_data.image_url,
  image_data.caption,
  image_data.display_order,
  image_data.is_active
FROM raffle, (VALUES
  ('/images/gallery/toyota-front.jpg', 'Vista frontal del Toyota Corolla', 1, true),
  ('/images/gallery/toyota-interior.jpg', 'Interior completamente equipado', 2, true),
  ('/images/gallery/toyota-side.jpg', 'Vista lateral', 3, true),
  ('/images/gallery/toyota-back.jpg', 'Vista posterior', 4, true)
) AS image_data(image_url, caption, display_order, is_active);

-- =====================================================
-- 5. VERIFICACIÓN - Mostrar datos insertados
-- =====================================================
SELECT
  'Sorteos creados:' as info,
  COUNT(*) as cantidad
FROM raffles;

SELECT
  'Paquetes de precios creados:' as info,
  COUNT(*) as cantidad
FROM pricing_packages;

SELECT
  'Premios creados:' as info,
  COUNT(*) as cantidad
FROM prizes;

SELECT
  'Imágenes creadas:' as info,
  COUNT(*) as cantidad
FROM raffle_images;

-- =====================================================
-- 6. MOSTRAR RESUMEN DEL SORTEO
-- =====================================================
SELECT
  r.id,
  r.title,
  r.activity_number,
  r.status,
  r.total_tickets,
  r.ticket_price,
  COUNT(DISTINCT pp.id) as num_packages,
  COUNT(DISTINCT p.id) as num_prizes
FROM raffles r
LEFT JOIN pricing_packages pp ON pp.raffle_id = r.id
LEFT JOIN prizes p ON p.raffle_id = r.id
WHERE r.slug = 'toyota-corolla-2024'
GROUP BY r.id;

-- =====================================================
-- 7. OPCIONAL: Insertar algunos tickets de ejemplo
-- =====================================================
-- NOTA: Solo descomentar si quieres simular que ya se vendieron algunos boletos
-- Esto requerirá tener usuarios y órdenes creadas primero

/*
-- Ejemplo de insertar tickets vendidos (descomentar si necesitas)
WITH raffle AS (
  SELECT id FROM raffles WHERE slug = 'toyota-corolla-2024'
),
customer AS (
  SELECT id FROM users WHERE email = 'rogelio@gmail.com' LIMIT 1
)
INSERT INTO tickets (raffle_id, user_id, ticket_number, status, purchase_date)
SELECT
  raffle.id,
  customer.id,
  generate_series(1, 150), -- 150 boletos vendidos
  'active',
  NOW() - INTERVAL '5 days'
FROM raffle, customer;
*/

COMMIT;
