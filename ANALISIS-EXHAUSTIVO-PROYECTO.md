# ANÁLISIS EXHAUSTIVO - PROYECTO IMPACTO MINGA
## Sistema de Sorteos/Rifas con Comercio Electrónico

**Fecha del Análisis:** 26 de Octubre, 2025
**Analista:** Claude Code
**Versión del Documento:** 1.0

---

## RESUMEN EJECUTIVO

### Estado General del Proyecto
El proyecto "Impacto Minga" es una aplicación de sorteos/rifas con comercio electrónico que se encuentra en una fase de **desarrollo inicial-medio (30% completado)**. La infraestructura fundamental está establecida (autenticación, base de datos, routing básico), pero **la mayoría de la lógica de negocio crítica aún no está implementada**.

### Hallazgos Críticos

#### ✅ COMPLETADO
- ✅ Base de datos PostgreSQL con schema completo (13 tablas)
- ✅ Sistema de autenticación JWT con 4 roles (super_admin, admin, contadora, customer)
- ✅ Login/Register funcional (frontend + backend)
- ✅ Dashboard administrativo (UI completa)
- ✅ Dashboard de clientes "MyAccount" (UI completa)
- ✅ Rutas protegidas por rol
- ✅ Header/Footer/ProtectedRoute components
- ✅ Configuración de conexión a BD (PostgreSQL en 167.235.20.41:5432)

#### ⚠️ PARCIALMENTE IMPLEMENTADO
- ⚠️ Homepage (Index.tsx) - **UI estática**, datos hardcodeados, NO conectado a BD
- ⚠️ Cart/Checkout - **UI completa pero completamente estática**, sin integración con backend
- ⚠️ Dashboards (Admin/Customer) - **UI sin datos reales**

#### ❌ NO IMPLEMENTADO (GAPS CRÍTICOS)
- ❌ **API completa de Raffles** (crear, listar, actualizar sorteos)
- ❌ **API de Orders** (crear órdenes, gestionar pagos)
- ❌ **API de Tickets** (asignar boletos, verificar disponibilidad)
- ❌ **Sistema de carga de comprobantes de pago**
- ❌ **Sistema de verificación/aprobación de pagos** (admin/contadora)
- ❌ **Generación de números aleatorios y asignación**
- ❌ **Sistema de premios progresivos**
- ❌ **Generación de recibos/comprobantes PDF**
- ❌ **Sistema de notificaciones por email**
- ❌ **Páginas de administración** (gestión de sorteos, órdenes, boletos, usuarios)
- ❌ **Integración de carrito con backend**
- ❌ **Flujo completo de compra**

---

## 1. INVENTARIO COMPLETO DEL PROYECTO

### 1.1 Estructura de Carpetas
```
proyectominga/
├── client/                    # Frontend React + TypeScript
│   ├── components/
│   │   ├── ui/               # 48 componentes UI (shadcn/ui)
│   │   ├── Header.tsx        # ✅ Navegación principal
│   │   ├── Footer.tsx        # ✅ Footer con info de contacto
│   │   └── ProtectedRoute.tsx # ✅ Guard de rutas por rol
│   ├── context/
│   │   └── AuthContext.tsx   # ✅ Context de autenticación
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   ├── use-mobile.tsx
│   │   └── useScrollTop.ts
│   ├── pages/
│   │   ├── Index.tsx         # ⚠️ Homepage (UI estática)
│   │   ├── Login.tsx         # ✅ Login funcional
│   │   ├── Register.tsx      # ✅ Registro funcional
│   │   ├── Cart.tsx          # ⚠️ Carrito (UI estática)
│   │   ├── Checkout.tsx      # ⚠️ Checkout (UI estática)
│   │   ├── Dashboard.tsx     # ⚠️ Admin dashboard (UI sin datos)
│   │   ├── MyAccount.tsx     # ⚠️ Customer account (UI sin datos)
│   │   └── NotFound.tsx      # ✅ Página 404
│   ├── lib/
│   │   └── utils.ts          # Utilidades
│   ├── App.tsx               # ✅ Router principal
│   └── global.css            # Estilos globales

├── server/                    # Backend Express.js
│   ├── db/
│   │   └── config.ts         # ✅ Configuración PostgreSQL
│   ├── routes/
│   │   ├── auth.ts           # ✅ Endpoints de autenticación (3 endpoints)
│   │   ├── db-test.ts        # ✅ Test de conexión a BD
│   │   └── demo.ts           # Endpoint de ejemplo
│   ├── index.ts              # ✅ Configuración de Express
│   └── node-build.ts         # Build script

├── shared/
│   └── api.ts                # Tipos compartidos (casi vacío)

├── SCHEMA.sql                # ✅ Schema completo de BD (775 líneas)
├── package.json              # ✅ Dependencias configuradas
└── .env                      # ✅ Variables de entorno
```

### 1.2 Base de Datos PostgreSQL

#### Estado de las Tablas
**Total de tablas creadas: 13**

```sql
-- ✅ TABLAS EXISTENTES
1. users                 -- 2 registros (admin + 1 test user)
2. addresses            -- 0 registros
3. raffles              -- 0 registros ❗ CRÍTICO
4. raffle_images        -- 0 registros
5. pricing_packages     -- 0 registros ❗ CRÍTICO
6. prizes               -- 0 registros
7. orders               -- 0 registros ❗ CRÍTICO
8. order_items          -- 0 registros
9. tickets              -- 0 registros ❗ CRÍTICO
10. receipts            -- 0 registros
11. receipt_items       -- 0 registros
12. status_history      -- 0 registros
13. system_settings     -- 11 registros ✅ (configuración inicial)
```

#### Schema Highlights
- **Roles de usuario:** super_admin, admin, contadora, customer
- **Estados de orden:** pending_payment, pending_verification, approved, completed, rejected, cancelled
- **Estados de ticket:** available, reserved, sold
- **Estados de raffle:** draft, active, completed, cancelled
- **Métodos de pago:** bank_transfer, cash, credit_card, debit_card
- **Triggers automáticos:** updated_at, prize unlock, status logging

### 1.3 API Backend Existente

#### Endpoints Implementados (Total: 3)
```
POST   /api/auth/register     ✅ Registrar nuevo usuario
POST   /api/auth/login        ✅ Iniciar sesión
GET    /api/auth/profile      ✅ Obtener perfil (requiere JWT)
GET    /api/db/test           ✅ Test de conexión a BD
GET    /api/demo              ✅ Endpoint de prueba
```

#### Endpoints FALTANTES (Críticos para MVP)
```
❌ RAFFLES (Sorteos)
  GET    /api/raffles                 - Listar sorteos activos
  GET    /api/raffles/:id             - Detalle de sorteo
  POST   /api/raffles                 - Crear sorteo (admin)
  PUT    /api/raffles/:id             - Actualizar sorteo (admin)
  DELETE /api/raffles/:id             - Eliminar sorteo (admin)
  GET    /api/raffles/:id/tickets     - Disponibilidad de boletos
  GET    /api/raffles/:id/packages    - Paquetes de precios

❌ ORDERS (Órdenes)
  POST   /api/orders                  - Crear orden
  GET    /api/orders                  - Listar órdenes (admin/contadora)
  GET    /api/orders/my-orders        - Mis órdenes (customer)
  GET    /api/orders/:id              - Detalle de orden
  PUT    /api/orders/:id/status       - Cambiar estado (admin/contadora)
  POST   /api/orders/:id/upload-proof - Subir comprobante de pago
  POST   /api/orders/:id/approve      - Aprobar pago (admin/contadora)
  POST   /api/orders/:id/reject       - Rechazar pago (admin/contadora)

❌ TICKETS (Boletos)
  POST   /api/tickets/reserve         - Reservar boletos (temporal)
  POST   /api/tickets/assign          - Asignar boletos (al aprobar orden)
  GET    /api/tickets/my-tickets      - Mis boletos (customer)

❌ PRIZES (Premios)
  GET    /api/raffles/:id/prizes      - Premios del sorteo
  POST   /api/prizes                  - Crear premio (admin)
  PUT    /api/prizes/:id              - Actualizar premio (admin)

❌ USERS (Gestión de usuarios)
  GET    /api/users                   - Listar usuarios (admin)
  GET    /api/users/:id               - Detalle usuario (admin)
  PUT    /api/users/:id               - Actualizar usuario (admin)
  PUT    /api/users/:id/status        - Cambiar estado (admin)

❌ RECEIPTS (Comprobantes)
  POST   /api/receipts                - Generar comprobante
  GET    /api/receipts/:id            - Obtener comprobante
  GET    /api/receipts/:id/pdf        - Descargar PDF

❌ SETTINGS (Configuración)
  GET    /api/settings                - Configuración del sistema
  PUT    /api/settings                - Actualizar configuración (super_admin)
```

### 1.4 Frontend - Páginas Implementadas

#### Páginas Públicas
| Página | Ruta | Estado | Conectado a API | Notas |
|--------|------|--------|----------------|-------|
| Homepage | `/` | ⚠️ Parcial | ❌ NO | UI completa pero datos hardcodeados |
| Login | `/login` | ✅ Completo | ✅ SÍ | Funcional, redirige por rol |
| Register | `/register` | ✅ Completo | ✅ SÍ | Funcional, valida datos |
| Cart | `/cart` | ⚠️ Parcial | ❌ NO | UI completa, sin integración |
| Checkout | `/checkout` | ⚠️ Parcial | ❌ NO | UI completa, sin integración |
| 404 | `*` | ✅ Completo | N/A | Página de error |

#### Páginas Protegidas (Admin/Contadora)
| Página | Ruta | Roles | Estado | Conectado a API |
|--------|------|-------|--------|----------------|
| Dashboard | `/dashboard` | super_admin, admin, contadora | ⚠️ Parcial | ❌ NO |
| Gestión de Sorteos | `/dashboard/raffles` | super_admin, admin | ❌ NO EXISTE | - |
| Crear Sorteo | `/dashboard/raffles/new` | super_admin, admin | ❌ NO EXISTE | - |
| Gestión de Órdenes | `/dashboard/orders` | super_admin, admin, contadora | ❌ NO EXISTE | - |
| Gestión de Boletos | `/dashboard/tickets` | super_admin, admin | ❌ NO EXISTE | - |
| Gestión de Usuarios | `/dashboard/users` | super_admin, admin | ❌ NO EXISTE | - |
| Configuración | `/dashboard/settings` | super_admin | ❌ NO EXISTE | - |
| Reportes | `/dashboard/reports` | contadora | ❌ NO EXISTE | - |

#### Páginas Protegidas (Customer)
| Página | Ruta | Estado | Conectado a API |
|--------|------|--------|----------------|
| MyAccount | `/my-account` | ⚠️ Parcial | ❌ NO |

---

## 2. ANÁLISIS DEL FLUJO DE NEGOCIO CRÍTICO

### 2.1 Flujo Esperado (según requirements)
```
1. Usuario ve sorteos en homepage (100% dinámico desde BD)
2. Selecciona paquete de boletos y cantidad
3. Va al carrito y procede al checkout
4. Completa información personal
5. Sube comprobante de transferencia bancaria
6. Admin/contadora revisa y aprueba el pago
7. Sistema asigna boletos al usuario (números aleatorios)
8. Usuario recibe email con números asignados
9. Usuario puede ver sus boletos en "Mis Compras"
10. Sistema verifica progreso de venta y desbloquea premios
11. Al completar 100%, se realiza sorteo
12. Ganador recibe notificación
```

### 2.2 Análisis de Implementación por Paso

| Paso | Descripción | Estado | Bloqueado por |
|------|-------------|--------|---------------|
| 1 | Ver sorteos en homepage | ❌ 0% | Falta API GET /api/raffles |
| 2 | Seleccionar paquete | ❌ 0% | Homepage estática, falta API de paquetes |
| 3 | Carrito funcional | ❌ 0% | Falta estado global, API de órdenes |
| 4 | Checkout con info personal | ⚠️ 50% | UI existe, falta integración con API |
| 5 | Subir comprobante | ❌ 0% | Falta API upload, almacenamiento de archivos |
| 6 | Admin aprueba pago | ❌ 0% | Falta página de órdenes, API de aprobación |
| 7 | Asignar boletos | ❌ 0% | Falta lógica de asignación, generación de números |
| 8 | Email con números | ❌ 0% | Falta servicio de email |
| 9 | Ver boletos en cuenta | ❌ 0% | Falta API de tickets del usuario |
| 10 | Desbloqueo de premios | ✅ 100% | Trigger en BD implementado |
| 11 | Sorteo automático | ❌ 0% | Falta lógica de sorteo |
| 12 | Notificar ganador | ❌ 0% | Falta servicio de notificaciones |

**⚠️ HALLAZGO CRÍTICO:** Solo el 8% del flujo de negocio está implementado (paso 10 únicamente).

---

## 3. GAPS Y DEPENDENCIAS

### 3.1 Mapa de Dependencias Críticas

```
CAPA 1 (FUNDAMENTAL) - Debe hacerse PRIMERO
├── ❌ API de Raffles (GET /api/raffles)
├── ❌ API de Pricing Packages (GET /api/raffles/:id/packages)
└── ❌ Conectar Homepage con API real

CAPA 2 (CARRITO Y ÓRDENES) - Depende de Capa 1
├── ❌ Estado global del carrito (Context/Zustand)
├── ❌ API de creación de órdenes (POST /api/orders)
├── ❌ Conectar Cart.tsx con estado global
└── ❌ Conectar Checkout.tsx con API

CAPA 3 (PAGOS) - Depende de Capa 2
├── ❌ Sistema de upload de archivos (comprobantes)
├── ❌ API POST /api/orders/:id/upload-proof
├── ❌ Almacenamiento de archivos (local/S3/Cloudinary)
└── ❌ Formulario de pago en Checkout

CAPA 4 (ADMINISTRACIÓN) - Depende de Capa 3
├── ❌ Página de gestión de órdenes (/dashboard/orders)
├── ❌ API de listado de órdenes pendientes
├── ❌ API de aprobación/rechazo de pagos
├── ❌ Interfaz para revisar comprobantes
└── ❌ Filtros y búsqueda de órdenes

CAPA 5 (ASIGNACIÓN DE BOLETOS) - Depende de Capa 4
├── ❌ Lógica de generación de números aleatorios
├── ❌ API de asignación de tickets
├── ❌ Verificación de disponibilidad
├── ❌ Transacciones atómicas (orden + tickets)
└── ❌ Trigger de desbloqueo de premios (✅ ya existe en BD)

CAPA 6 (COMPROBANTES Y NOTIFICACIONES) - Depende de Capa 5
├── ❌ Generación de PDF (receipt)
├── ❌ Servicio de email (Nodemailer/SendGrid)
├── ❌ Templates de email
└── ❌ API de generación de comprobantes

CAPA 7 (CONSULTA Y VISUALIZACIÓN) - Depende de Capa 6
├── ❌ API GET /api/tickets/my-tickets
├── ❌ Conectar MyAccount.tsx con API
├── ❌ Mostrar boletos comprados
└── ❌ Mostrar órdenes históricas

CAPA 8 (ADMINISTRACIÓN COMPLETA) - Paralelo a otras capas
├── ❌ CRUD de sorteos (/dashboard/raffles)
├── ❌ CRUD de premios
├── ❌ CRUD de usuarios
├── ❌ Configuración del sistema
└── ❌ Reportes y analytics
```

### 3.2 Inconsistencias Detectadas

#### Schema vs Código
1. ✅ **Roles:** Consistentes entre schema y código (super_admin, admin, contadora, customer)
2. ✅ **Estados:** Enums bien definidos en BD y tipados en TypeScript
3. ⚠️ **Campos opcionales:** Schema permite `phone` NULL, pero frontend lo requiere
4. ✅ **Naming:** Snake_case en BD, camelCase en código (correcta conversión)

#### Lógica de Negocio
1. ❌ **Homepage:** Muestra "Actividad #39" hardcodeada, pero no hay raffles en BD
2. ❌ **Pricing tiers:** Frontend tiene 6 paquetes hardcodeados, pero tabla `pricing_packages` está vacía
3. ❌ **Progress bar:** Muestra "35.74%" hardcodeado, sin calcular desde tickets vendidos
4. ❌ **Cart items:** Frontend simula items, pero no hay conexión con raffles reales
5. ❌ **Order status:** Dashboard muestra stats en 0, debería obtener de BD

---

## 4. ROADMAP DETALLADO DE IMPLEMENTACIÓN

### FASE 1: MVP CRÍTICO - FLUJO BÁSICO DE COMPRA
**Objetivo:** Permitir que un cliente compre boletos y el admin los apruebe
**Prioridad:** 🔴 CRÍTICA
**Duración estimada:** 2-3 semanas
**Complejidad:** Media-Alta

#### Backend (Fase 1)
```
1.1 API de Raffles
   📁 server/routes/raffles.ts
   - GET /api/raffles (listar activos)
   - GET /api/raffles/:id (detalle)
   - GET /api/raffles/:id/packages (paquetes de precios)
   - GET /api/raffles/:id/availability (boletos disponibles)
   Complejidad: SIMPLE

1.2 API de Orders
   📁 server/routes/orders.ts
   - POST /api/orders (crear orden pendiente)
   - GET /api/orders/my-orders (órdenes del usuario autenticado)
   - GET /api/orders/:id (detalle de orden)
   - POST /api/orders/:id/upload-proof (subir comprobante)
   - GET /api/orders (listar todas - admin/contadora)
   - PUT /api/orders/:id/approve (aprobar pago - admin/contadora)
   - PUT /api/orders/:id/reject (rechazar pago - admin/contadora)
   Complejidad: MEDIA

1.3 API de Tickets
   📁 server/routes/tickets.ts
   - POST /api/tickets/assign (asignar boletos al aprobar orden)
   - GET /api/tickets/my-tickets (boletos del usuario)
   Complejidad: MEDIA-ALTA (lógica de números aleatorios)

1.4 Upload de Archivos
   📁 server/middleware/upload.ts
   - Configurar multer para archivos (comprobantes de pago)
   - Almacenamiento local o Cloudinary
   - Validación de tipos de archivo (jpg, png, pdf)
   Complejidad: SIMPLE

1.5 Utilidades
   📁 server/utils/
   - generateOrderNumber.ts (genera PF-XXXXXXXX)
   - assignTickets.ts (asignar números aleatorios sin duplicados)
   - calculateOrderTotals.ts (subtotal, tax, total)
   Complejidad: SIMPLE
```

#### Frontend (Fase 1)
```
1.6 Homepage Dinámica
   📝 Modificar: client/pages/Index.tsx
   - Conectar con GET /api/raffles
   - Cargar sorteo activo dinámicamente
   - Mostrar progress bar real (calculado desde tickets vendidos)
   - Cargar paquetes de precios desde API
   Complejidad: SIMPLE

1.7 Estado Global del Carrito
   📁 client/context/CartContext.tsx (NUEVO)
   - Añadir items al carrito
   - Actualizar cantidades
   - Eliminar items
   - Calcular totales
   - Persistir en localStorage
   Complejidad: SIMPLE

1.8 Cart Funcional
   📝 Modificar: client/pages/Cart.tsx
   - Conectar con CartContext
   - Mostrar items reales
   - Calcular totales dinámicamente
   Complejidad: SIMPLE

1.9 Checkout con Creación de Orden
   📝 Modificar: client/pages/Checkout.tsx
   - Formulario de datos personales
   - Upload de comprobante de pago
   - Crear orden con POST /api/orders
   - Subir comprobante con POST /api/orders/:id/upload-proof
   - Mostrar número de orden generado
   Complejidad: MEDIA

1.10 Dashboard de Órdenes (Admin)
   📁 client/pages/dashboard/Orders.tsx (NUEVO)
   - Listar órdenes con filtros (pendientes, todas)
   - Ver comprobante de pago
   - Botones aprobar/rechazar
   - Estado en tiempo real
   Complejidad: MEDIA

1.11 Mis Compras (Customer)
   📝 Modificar: client/pages/MyAccount.tsx
   - Conectar con GET /api/orders/my-orders
   - Mostrar órdenes históricas
   - Ver números asignados (cuando orden esté aprobada)
   - Estado de cada orden
   Complejidad: SIMPLE
```

#### Orden de Implementación (Fase 1)
```
DÍA 1-2: Backend Base
  ✓ 1.1 API de Raffles (GET endpoints)
  ✓ 1.5 Utilidades básicas

DÍA 3-4: Homepage Dinámica
  ✓ 1.6 Conectar homepage con API
  ✓ 1.7 CartContext

DÍA 5-6: Carrito y Checkout
  ✓ 1.8 Cart funcional
  ✓ 1.4 Upload de archivos
  ✓ 1.2 API de Orders (crear orden)

DÍA 7-8: Checkout completo
  ✓ 1.9 Checkout con upload

DÍA 9-11: Administración de Órdenes
  ✓ 1.2 API de Orders (aprobar/rechazar)
  ✓ 1.10 Dashboard de órdenes

DÍA 12-14: Asignación de Boletos
  ✓ 1.3 API de Tickets
  ✓ 1.11 Mis compras actualizado
  ✓ Testing end-to-end del flujo completo
```

### FASE 2: GESTIÓN ADMINISTRATIVA
**Objetivo:** Permitir crear/editar sorteos, gestionar premios, usuarios
**Prioridad:** 🟡 IMPORTANTE
**Duración estimada:** 2 semanas
**Complejidad:** Media

#### Backend (Fase 2)
```
2.1 API de Raffles (CRUD completo)
   📝 Modificar: server/routes/raffles.ts
   - POST /api/raffles (crear sorteo)
   - PUT /api/raffles/:id (actualizar sorteo)
   - DELETE /api/raffles/:id (soft delete)
   - PUT /api/raffles/:id/status (cambiar estado: draft→active→completed)
   - POST /api/raffles/:id/images (subir imágenes)
   Complejidad: MEDIA

2.2 API de Pricing Packages
   📁 server/routes/pricing-packages.ts (NUEVO)
   - POST /api/raffles/:raffleId/packages (crear paquete)
   - PUT /api/packages/:id (actualizar paquete)
   - DELETE /api/packages/:id (eliminar paquete)
   Complejidad: SIMPLE

2.3 API de Prizes
   📁 server/routes/prizes.ts (NUEVO)
   - GET /api/raffles/:raffleId/prizes
   - POST /api/prizes (crear premio)
   - PUT /api/prizes/:id (actualizar premio)
   - DELETE /api/prizes/:id (eliminar premio)
   - PUT /api/prizes/:id/claim (marcar como reclamado)
   Complejidad: SIMPLE

2.4 API de Users (gestión)
   📁 server/routes/users.ts (NUEVO)
   - GET /api/users (listar todos - admin)
   - GET /api/users/:id (detalle - admin)
   - PUT /api/users/:id (actualizar - admin)
   - PUT /api/users/:id/status (cambiar estado - admin)
   Complejidad: SIMPLE

2.5 Generación Automática de Tickets
   📁 server/utils/generateTickets.ts (NUEVO)
   - Al crear raffle, generar automáticamente N tickets con estado "available"
   - Números secuenciales del 1 al total_tickets
   Complejidad: SIMPLE
```

#### Frontend (Fase 2)
```
2.6 Gestión de Sorteos
   📁 client/pages/dashboard/raffles/ (NUEVO)
   - RafflesList.tsx (listar sorteos)
   - RaffleForm.tsx (crear/editar sorteo)
   - RaffleDetail.tsx (ver detalle, estadísticas)
   - Gestión de paquetes de precios
   - Gestión de premios
   - Upload de imágenes
   Complejidad: ALTA

2.7 Gestión de Usuarios
   📁 client/pages/dashboard/users/ (NUEVO)
   - UsersList.tsx (listar usuarios)
   - UserDetail.tsx (ver/editar usuario)
   - Cambiar rol y estado
   Complejidad: MEDIA

2.8 Actualizar Dashboard Principal
   📝 Modificar: client/pages/Dashboard.tsx
   - Obtener stats reales desde API
   - Gráficas de ventas
   - Actividad reciente
   Complejidad: SIMPLE
```

#### Orden de Implementación (Fase 2)
```
DÍA 1-3: CRUD de Sorteos
  ✓ 2.1 API completa de Raffles
  ✓ 2.5 Generación automática de tickets

DÍA 4-6: Interfaz de Sorteos
  ✓ 2.6 Páginas de gestión de sorteos

DÍA 7-9: Paquetes y Premios
  ✓ 2.2 API de Pricing Packages
  ✓ 2.3 API de Prizes
  ✓ Integrar en frontend de sorteos

DÍA 10-12: Gestión de Usuarios
  ✓ 2.4 API de Users
  ✓ 2.7 Páginas de usuarios

DÍA 13-14: Dashboard mejorado
  ✓ 2.8 Stats reales
  ✓ Testing de todas las funcionalidades admin
```

### FASE 3: COMPROBANTES Y NOTIFICACIONES
**Objetivo:** Generar PDFs, enviar emails, mejorar UX
**Prioridad:** 🟢 MEJORAS
**Duración estimada:** 1-2 semanas
**Complejidad:** Media

#### Backend (Fase 3)
```
3.1 Generación de Comprobantes PDF
   📁 server/services/pdf-generator.ts (NUEVO)
   - Librería: pdfkit o puppeteer
   - Template de comprobante con logo
   - Incluir: números asignados, datos del cliente, totales
   - POST /api/receipts (generar y guardar en BD)
   Complejidad: MEDIA

3.2 Servicio de Email
   📁 server/services/email-service.ts (NUEVO)
   - Librería: nodemailer
   - Configurar SMTP (Gmail, SendGrid, AWS SES)
   - Templates HTML para emails
   - Emails a enviar:
     * Confirmación de registro
     * Orden creada (pendiente pago)
     * Orden aprobada + números asignados
     * Orden rechazada
     * Premio desbloqueado
     * Ganador de sorteo
   Complejidad: MEDIA

3.3 Notificaciones en tiempo real
   📁 server/services/notifications.ts (NUEVO)
   - WebSockets (opcional, para admin dashboard)
   - Notificar cuando hay nueva orden pendiente
   Complejidad: MEDIA-ALTA (opcional)
```

#### Frontend (Fase 3)
```
3.4 Visualización de Comprobantes
   📁 client/pages/Receipt.tsx (NUEVO)
   - Ver comprobante en pantalla
   - Descargar PDF
   - Imprimir
   Complejidad: SIMPLE

3.5 Notificaciones Toast
   - Usar sonner (ya instalado)
   - Notificar acciones exitosas/errores
   - Feedback visual mejorado
   Complejidad: SIMPLE

3.6 Mejoras de UX
   - Loading states mejorados
   - Skeleton screens
   - Animaciones smooth
   - Confirmaciones antes de acciones críticas
   Complejidad: SIMPLE
```

#### Orden de Implementación (Fase 3)
```
DÍA 1-3: PDFs
  ✓ 3.1 Generación de comprobantes
  ✓ 3.4 Visualización en frontend

DÍA 4-7: Emails
  ✓ 3.2 Servicio de email
  ✓ Integrar en flujo de órdenes
  ✓ Templates de email

DÍA 8-10: UX y notificaciones
  ✓ 3.5 Notificaciones toast
  ✓ 3.6 Mejoras de UX
  ✓ 3.3 WebSockets (opcional)
```

### FASE 4: REPORTES Y ANALYTICS
**Objetivo:** Reportes para contadora, analytics, configuración avanzada
**Prioridad:** 🟣 FUTURO
**Duración estimada:** 1 semana
**Complejidad:** Media

#### Backend (Fase 4)
```
4.1 API de Reportes
   📁 server/routes/reports.ts (NUEVO)
   - GET /api/reports/sales (reporte de ventas)
   - GET /api/reports/revenue (ingresos por período)
   - GET /api/reports/raffles (desempeño de sorteos)
   - GET /api/reports/customers (clientes más activos)
   - Filtros: fecha, sorteo, estado
   - Exportar a CSV/Excel
   Complejidad: MEDIA

4.2 API de Settings
   📁 server/routes/settings.ts (NUEVO)
   - GET /api/settings (obtener configuración)
   - PUT /api/settings (actualizar - super_admin)
   - Settings a gestionar:
     * Tax rate
     * WhatsApp number
     * Bank accounts
     * Company info
     * Reservation minutes
   Complejidad: SIMPLE
```

#### Frontend (Fase 4)
```
4.3 Página de Reportes (Contadora)
   📁 client/pages/dashboard/reports/ (NUEVO)
   - SalesReport.tsx (ventas por período)
   - RevenueChart.tsx (gráfica de ingresos)
   - ExportButton.tsx (exportar a CSV)
   - Filtros avanzados
   Complejidad: MEDIA

4.4 Página de Configuración (Super Admin)
   📁 client/pages/dashboard/Settings.tsx (NUEVO)
   - Formularios de configuración
   - Cuentas bancarias
   - Información de la empresa
   - Configuraciones generales
   Complejidad: SIMPLE

4.5 Analytics Dashboard
   📝 Mejorar: client/pages/Dashboard.tsx
   - Gráficas con recharts
   - KPIs principales
   - Tendencias
   Complejidad: MEDIA
```

---

## 5. TAREAS DETALLADAS CON ORDEN DE EJECUCIÓN

### 5.1 Secuencia de Implementación Óptima

#### SEMANA 1: Fundamentos del Flujo de Compra

**Día 1 - Setup Backend Base**
```
1. Crear estructura de carpetas server/routes/
2. Crear server/routes/raffles.ts
   - Implementar GET /api/raffles (listar activos)
   - Implementar GET /api/raffles/:id (detalle)
3. Crear server/routes/pricing-packages.ts
   - Implementar GET /api/raffles/:id/packages
4. Crear server/utils/generateOrderNumber.ts
5. Testing con Postman/Thunder Client
```

**Día 2 - Homepage Dinámica**
```
1. Modificar client/pages/Index.tsx
   - Eliminar datos hardcodeados
   - Agregar useState/useEffect para fetch
   - Conectar con GET /api/raffles
   - Mostrar sorteo real
2. Cargar paquetes de precios dinámicamente
3. Calcular progress bar real (tickets vendidos / total)
4. Testing visual
```

**Día 3 - Estado Global del Carrito**
```
1. Crear client/context/CartContext.tsx
   - Definir types (CartItem, CartState)
   - Implementar addToCart()
   - Implementar removeFromCart()
   - Implementar updateQuantity()
   - Calcular subtotal, tax, total
   - Persistir en localStorage
2. Actualizar client/App.tsx (envolver con CartProvider)
3. Testing de funciones del carrito
```

**Día 4 - Cart Page Funcional**
```
1. Modificar client/pages/Cart.tsx
   - Conectar con useCart()
   - Mostrar items reales
   - Botones de +/- funcionales
   - Calcular totales dinámicamente
2. Link a Checkout funcional
3. Testing del flujo completo hasta checkout
```

**Día 5 - Upload de Archivos (Backend)**
```
1. Instalar multer: npm install multer @types/multer
2. Crear server/middleware/upload.ts
   - Configurar multer (local storage o cloudinary)
   - Validar tipos de archivo
3. Crear carpeta public/uploads/
4. Crear server/routes/orders.ts
   - Implementar POST /api/orders (crear orden)
   - Implementar POST /api/orders/:id/upload-proof
5. Testing con Postman
```

**Día 6 - Checkout con Upload**
```
1. Modificar client/pages/Checkout.tsx
   - Conectar con useCart()
   - Agregar input de upload
   - Implementar handleSubmit()
   - POST /api/orders (crear orden)
   - POST /api/orders/:id/upload-proof (subir comprobante)
2. Mostrar número de orden generado
3. Redirigir a página de confirmación
4. Testing del flujo completo
```

**Día 7 - API de Orders (Admin)**
```
1. Completar server/routes/orders.ts
   - GET /api/orders (listar todas - con filtros)
   - GET /api/orders/:id (detalle)
   - PUT /api/orders/:id/approve (aprobar)
   - PUT /api/orders/:id/reject (rechazar)
2. Middleware de autorización (solo admin/contadora)
3. Testing con Postman
```

#### SEMANA 2: Administración y Asignación de Boletos

**Día 8 - Dashboard de Órdenes (Frontend)**
```
1. Crear client/pages/dashboard/Orders.tsx
   - Tabla de órdenes con estados
   - Filtros (pendientes, todas)
   - Modal para ver comprobante
2. Componente OrderCard.tsx
   - Mostrar datos de orden
   - Botones aprobar/rechazar
3. Conectar con GET /api/orders
4. Testing visual
```

**Día 9 - Aprobación de Órdenes**
```
1. Implementar botones aprobar/rechazar en Orders.tsx
   - PUT /api/orders/:id/approve
   - PUT /api/orders/:id/reject
2. Actualizar lista después de aprobar/rechazar
3. Notificaciones toast
4. Testing del flujo de aprobación
```

**Día 10 - Asignación de Boletos (Backend)**
```
1. Crear server/utils/assignTickets.ts
   - Generar números aleatorios sin duplicados
   - Algoritmo: shuffle de array [1..N]
   - Marcar tickets como "sold"
   - Asignar a orden y usuario
2. Crear server/routes/tickets.ts
   - POST /api/tickets/assign
   - GET /api/tickets/my-tickets
3. Integrar en PUT /api/orders/:id/approve
   - Al aprobar, asignar tickets automáticamente
4. Testing con datos reales
```

**Día 11 - Mis Compras (Frontend)**
```
1. Modificar client/pages/MyAccount.tsx
   - Conectar con GET /api/orders/my-orders
   - Mostrar órdenes históricas
   - Ver números asignados (si orden aprobada)
   - Estados visuales
2. Componente MyTickets.tsx
   - Mostrar números en formato visual
3. Testing con usuario de prueba
```

**Día 12 - Testing End-to-End**
```
1. Flujo completo de compra (usuario nuevo)
   - Registro
   - Ver homepage
   - Agregar al carrito
   - Checkout
   - Upload comprobante
2. Flujo de admin
   - Login como admin
   - Ver órdenes pendientes
   - Aprobar orden
3. Verificar asignación de boletos
4. Verificar "Mis compras"
5. Documentar bugs encontrados
```

**Día 13-14 - Bug Fixes y Refinamiento**
```
1. Corregir bugs del testing
2. Mejorar UX (loading states, mensajes de error)
3. Validaciones adicionales
4. Testing final
5. Deploy a staging
```

---

## 6. ESTIMACIONES DE COMPLEJIDAD

### 6.1 Por Componente

| Componente | Complejidad | Tiempo Estimado | Dependencias |
|------------|-------------|----------------|--------------|
| API Raffles (GET) | 🟢 Simple | 3-4 horas | BD ya existe |
| API Orders (CRUD) | 🟡 Media | 8-10 horas | Upload middleware |
| API Tickets (asignación) | 🟠 Media-Alta | 6-8 horas | Lógica de números aleatorios |
| Upload de archivos | 🟢 Simple | 2-3 horas | Multer |
| CartContext | 🟢 Simple | 3-4 horas | - |
| Homepage dinámica | 🟢 Simple | 4-5 horas | API Raffles |
| Checkout completo | 🟡 Media | 6-8 horas | Upload, API Orders |
| Dashboard de Órdenes | 🟡 Media | 8-10 horas | API Orders |
| Mis Compras | 🟢 Simple | 4-5 horas | API Orders, Tickets |
| CRUD de Sorteos | 🔴 Alta | 12-16 horas | Upload de imágenes, validaciones |
| Generación de PDFs | 🟡 Media | 6-8 horas | PDFKit o Puppeteer |
| Servicio de Email | 🟡 Media | 6-8 horas | Nodemailer, templates |
| Reportes | 🟡 Media | 8-10 horas | Queries complejas |

### 6.2 Por Fase

| Fase | Complejidad General | Tiempo Total | Riesgo | Bloqueadores |
|------|-------------------|--------------|--------|--------------|
| Fase 1 (MVP) | 🟡 Media-Alta | 2-3 semanas | 🟡 Medio | Upload de archivos, asignación de tickets |
| Fase 2 (Admin) | 🟡 Media | 2 semanas | 🟢 Bajo | Fase 1 completada |
| Fase 3 (Comprobantes) | 🟡 Media | 1-2 semanas | 🟢 Bajo | Configuración SMTP |
| Fase 4 (Reportes) | 🟢 Simple-Media | 1 semana | 🟢 Bajo | - |

---

## 7. RECOMENDACIONES TÉCNICAS

### 7.1 Arquitectura y Patrones

#### Backend
```typescript
// Estructura recomendada para routes
server/
├── routes/
│   ├── raffles.ts       // Endpoints de sorteos
│   ├── orders.ts        // Endpoints de órdenes
│   ├── tickets.ts       // Endpoints de boletos
│   └── index.ts         // Exportar todas las rutas
├── controllers/         // NUEVO - Lógica de negocio
│   ├── raffleController.ts
│   ├── orderController.ts
│   └── ticketController.ts
├── services/            // NUEVO - Servicios reutilizables
│   ├── emailService.ts
│   ├── pdfService.ts
│   └── ticketService.ts
├── middleware/
│   ├── auth.ts          // NUEVO - Middleware de autenticación
│   ├── upload.ts        // Upload de archivos
│   └── validate.ts      // NUEVO - Validación con Zod
├── utils/
│   ├── generateOrderNumber.ts
│   ├── assignTickets.ts
│   └── calculateTotals.ts
└── db/
    └── config.ts        // Ya existe
```

**Patrón recomendado: Controller-Service**
```typescript
// Ejemplo: server/controllers/orderController.ts
export async function createOrder(req: Request, res: Response) {
  try {
    const validatedData = orderSchema.parse(req.body);
    const order = await OrderService.create(validatedData);
    res.status(201).json({ success: true, order });
  } catch (err) {
    handleError(err, res);
  }
}

// Ejemplo: server/services/orderService.ts
export class OrderService {
  static async create(data: OrderData) {
    const orderNumber = generateOrderNumber();
    const totals = calculateTotals(data.items);

    const result = await pool.query(
      `INSERT INTO orders (...) VALUES (...) RETURNING *`,
      [...]
    );

    return result.rows[0];
  }
}
```

#### Frontend
```typescript
// Estructura recomendada
client/
├── api/                 // NUEVO - Funciones de llamadas a API
│   ├── raffles.ts
│   ├── orders.ts
│   └── tickets.ts
├── hooks/               // Ya existe
│   ├── useRaffles.ts    // NUEVO - Custom hooks para data fetching
│   ├── useOrders.ts
│   └── useCart.ts
├── types/               // NUEVO - Tipos compartidos
│   ├── raffle.types.ts
│   ├── order.types.ts
│   └── user.types.ts
├── utils/               // NUEVO - Utilidades frontend
│   ├── formatters.ts    // Formatear precios, fechas
│   └── validators.ts    // Validaciones de formularios
└── components/
    ├── raffle/          // NUEVO - Componentes de sorteo
    ├── order/           // NUEVO - Componentes de orden
    └── shared/          // NUEVO - Componentes compartidos
```

**Patrón recomendado: Custom Hooks + API Layer**
```typescript
// Ejemplo: client/api/raffles.ts
export const rafflesApi = {
  getAll: async () => {
    const res = await fetch('/api/raffles');
    if (!res.ok) throw new Error('Failed to fetch raffles');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`/api/raffles/${id}`);
    if (!res.ok) throw new Error('Failed to fetch raffle');
    return res.json();
  }
};

// Ejemplo: client/hooks/useRaffles.ts
export function useRaffles() {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    rafflesApi.getAll()
      .then(setRaffles)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { raffles, loading, error };
}
```

### 7.2 Validación de Datos

**Usar Zod (ya instalado) en backend:**
```typescript
// server/schemas/orderSchema.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  raffleId: z.string().uuid(),
  items: z.array(z.object({
    packageId: z.string().uuid(),
    quantity: z.number().int().min(1)
  })),
  customerEmail: z.string().email(),
  customerFirstName: z.string().min(1),
  customerLastName: z.string().min(1),
  // ...
});

// Uso en controller:
const validatedData = createOrderSchema.parse(req.body);
```

### 7.3 Manejo de Errores

**Error handler centralizado:**
```typescript
// server/middleware/errorHandler.ts
export function handleError(err: any, res: Response) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry'
    });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}
```

### 7.4 Seguridad

#### Recomendaciones críticas:
1. **NUNCA** exponer contraseñas en logs
2. **SIEMPRE** validar y sanitizar inputs del usuario
3. **Limitar** tamaño de upload de archivos (max 5MB)
4. **Validar** tipos de archivo permitidos (jpg, png, pdf)
5. **Rate limiting** en endpoints sensibles (login, registro)
6. **CORS** configurado correctamente (solo dominios permitidos)
7. **Helmet.js** para headers de seguridad

```typescript
// Agregar en server/index.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // Límite de 100 requests por IP
});

app.use('/api/auth', limiter);
```

### 7.5 Performance

#### Optimizaciones recomendadas:

**Backend:**
- Usar índices en BD (ya existen en schema)
- Paginación en listados (órdenes, usuarios, boletos)
- Cache de sorteos activos (Redis opcional)
- Lazy loading de imágenes

**Frontend:**
- React.lazy() para code splitting
- Memoización con useMemo/useCallback
- Virtualización de listas largas (react-window)
- Optimistic updates en mutaciones

```typescript
// Ejemplo de paginación
GET /api/orders?page=1&limit=20&status=pending_verification

// Ejemplo de lazy loading
const Orders = React.lazy(() => import('./pages/dashboard/Orders'));
```

### 7.6 Testing

**Estrategia de testing recomendada:**

1. **Backend (Vitest ya instalado):**
   - Unit tests de utils (generateOrderNumber, assignTickets)
   - Integration tests de API endpoints
   - Tests de lógica de negocio crítica

2. **Frontend:**
   - Tests de componentes críticos (Cart, Checkout)
   - Tests de custom hooks
   - Tests de integración con @testing-library/react

```typescript
// Ejemplo: server/utils/assignTickets.test.ts
import { describe, it, expect } from 'vitest';
import { assignRandomTickets } from './assignTickets';

describe('assignRandomTickets', () => {
  it('should assign unique random numbers', () => {
    const tickets = assignRandomTickets(5, 100);
    expect(tickets).toHaveLength(5);
    expect(new Set(tickets).size).toBe(5); // No duplicados
  });
});
```

### 7.7 Deploy y DevOps

**Checklist pre-producción:**
- [ ] Variables de entorno en .env.production (NO commitear)
- [ ] Cambiar JWT_SECRET a valor fuerte aleatorio
- [ ] Cambiar password del admin inicial
- [ ] Configurar backup automático de BD
- [ ] Configurar SSL/HTTPS
- [ ] Configurar CORS solo para dominio de producción
- [ ] Configurar logging (Winston/Pino)
- [ ] Configurar monitoring (opcional: Sentry)
- [ ] Documentar API con Swagger (opcional)

---

## 8. RIESGOS Y MITIGACIÓN

### 8.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Asignación de boletos duplicados | Media | Alto | Usar transacciones atómicas, índice UNIQUE en (raffle_id, ticket_number) |
| Pérdida de archivos subidos | Baja | Alto | Backup automático, usar servicio externo (S3/Cloudinary) |
| Overflow de emails | Media | Medio | Queue system (Bull/BullMQ), rate limiting |
| Desincronización de stock | Media | Alto | Transacciones, verificación doble al aprobar |
| Pérdida de órdenes | Baja | Crítico | Backup diario de BD, replicación |
| SQL Injection | Baja | Crítico | Siempre usar prepared statements (pg ya lo hace) |

### 8.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Fraude en comprobantes | Alta | Alto | Validación manual obligatoria, verificación de datos bancarios |
| Usuarios crean múltiples cuentas | Media | Medio | Validar documento de identidad único, captcha en registro |
| Sorteo sin alcanzar 100% | Media | Medio | Definir política de reembolso, sorteo proporcional |
| Disputa de ganador | Baja | Crítico | Guardar logs de sorteo, transparencia total |

---

## 9. MÉTRICAS DE ÉXITO

### 9.1 Métricas Técnicas

**Fase 1 (MVP):**
- [ ] Usuario puede completar compra end-to-end en <5 minutos
- [ ] Admin puede aprobar/rechazar orden en <2 minutos
- [ ] 0 boletos duplicados asignados
- [ ] 100% de órdenes tienen números asignados correctamente
- [ ] API response time <500ms (90 percentil)

**Fase 2 (Admin):**
- [ ] Admin puede crear sorteo completo en <10 minutos
- [ ] CRUD de sorteos funciona sin bugs
- [ ] Stats del dashboard se actualizan en tiempo real

**Fase 3 (Comprobantes):**
- [ ] 100% de órdenes aprobadas generan comprobante PDF
- [ ] 100% de usuarios reciben email de confirmación
- [ ] Email delivery rate >95%

**Fase 4 (Reportes):**
- [ ] Reportes se generan en <3 segundos
- [ ] Exportar CSV funciona sin errores

### 9.2 Métricas de Negocio

- [ ] Tasa de conversión (visita → compra): >10%
- [ ] Tiempo promedio de aprobación de pago: <24 horas
- [ ] Satisfacción del usuario: >4.5/5
- [ ] Tasa de disputas: <1%

---

## 10. CONCLUSIÓN Y PRÓXIMOS PASOS

### 10.1 Resumen del Estado Actual

**Fortalezas:**
- ✅ Infraestructura sólida (BD, autenticación, routing)
- ✅ Schema de BD bien diseñado y completo
- ✅ UI moderna y atractiva (shadcn/ui)
- ✅ Stack tecnológico adecuado (React + Express + PostgreSQL)

**Debilidades:**
- ❌ 0% del flujo de negocio crítico implementado
- ❌ Falta integración frontend-backend
- ❌ No hay gestión administrativa
- ❌ Datos estáticos en todas las páginas

### 10.2 Prioridades Inmediatas (Primera Semana)

**HACER PRIMERO:**
1. ✅ API GET /api/raffles
2. ✅ Conectar homepage con API
3. ✅ CartContext
4. ✅ API POST /api/orders
5. ✅ Checkout con upload de comprobante

**Esto desbloqueará:**
- Usuario puede ver sorteos reales
- Usuario puede comprar y subir comprobante
- Base para continuar con aprobación de admin

### 10.3 Decisiones Críticas a Tomar

1. **Almacenamiento de archivos:**
   - Local (simple, barato, riesgo de pérdida)
   - Cloudinary (fácil, gratis hasta 25GB)
   - AWS S3 (robusto, requiere configuración)
   - **Recomendación:** Cloudinary para MVP

2. **Servicio de Email:**
   - Gmail SMTP (simple, límite 500/día)
   - SendGrid (15k emails gratis/mes)
   - AWS SES (robusto, pago por uso)
   - **Recomendación:** SendGrid para MVP

3. **Sistema de notificaciones:**
   - Solo email (simple)
   - Email + WebSockets (tiempo real, complejo)
   - Email + WhatsApp (requiere Twilio/WhatsApp API)
   - **Recomendación:** Solo email para MVP, WhatsApp en Fase 3

4. **Método de sorteo:**
   - Manual (admin selecciona ganador)
   - Automático (random al alcanzar 100%)
   - Lotería nacional (transparencia máxima)
   - **Recomendación:** Automático con verificación manual

### 10.4 Plan de Acción Inmediato

**Esta semana:**
1. Crear sorteo de prueba en BD manualmente
2. Implementar API GET /api/raffles
3. Conectar homepage con datos reales
4. Implementar CartContext
5. Testing del flujo básico

**Próxima semana:**
1. API de Orders completa
2. Upload de comprobantes
3. Dashboard de órdenes para admin
4. Asignación de boletos
5. Testing end-to-end

**Semana 3:**
1. Refinamiento y bug fixes
2. Mejoras de UX
3. Deploy a staging
4. Testing con usuarios reales
5. Preparar lanzamiento MVP

---

## ANEXOS

### A. Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo
npm run build           # Build de producción
npm run start           # Inicia servidor de producción

# Base de datos
# Conectar con psql (si está instalado)
psql "postgresql://postgres:AgroCursos2025@167.235.20.41:5432/proyectominga"

# Backup de BD
pg_dump "postgresql://postgres:AgroCursos2025@167.235.20.41:5432/proyectominga" > backup.sql

# Restaurar BD
psql "postgresql://postgres:AgroCursos2025@167.235.20.41:5432/proyectominga" < backup.sql
```

### B. Queries SQL Útiles

```sql
-- Ver sorteos activos
SELECT * FROM raffles WHERE status = 'active' AND deleted_at IS NULL;

-- Ver órdenes pendientes
SELECT * FROM orders WHERE status = 'pending_verification';

-- Ver boletos vendidos de un sorteo
SELECT COUNT(*) FROM tickets WHERE raffle_id = 'xxx' AND status = 'sold';

-- Calcular porcentaje de venta
SELECT
  r.title,
  r.total_tickets,
  COUNT(t.id) as sold,
  ROUND((COUNT(t.id)::NUMERIC / r.total_tickets * 100), 2) as percentage
FROM raffles r
LEFT JOIN tickets t ON t.raffle_id = r.id AND t.status = 'sold'
WHERE r.id = 'xxx'
GROUP BY r.id, r.title, r.total_tickets;
```

### C. Ejemplo de Sorteo de Prueba

```sql
-- Insertar sorteo de prueba
INSERT INTO raffles (
  title,
  description,
  slug,
  status,
  activity_number,
  total_tickets,
  ticket_price,
  start_date,
  end_date,
  featured
) VALUES (
  'FORD MUSTANG CONVERTIBLE + 3 PREMIOS MÁS',
  'Gran sorteo con 4 premios increíbles',
  'actividad-39',
  'active',
  39,
  1000,
  2.00,
  NOW(),
  NOW() + INTERVAL '30 days',
  TRUE
) RETURNING id;

-- Insertar paquetes de precios (usando el ID del sorteo)
INSERT INTO pricing_packages (raffle_id, quantity, price, is_most_popular, display_order)
VALUES
  ('SORTEO_ID', 5, 10, FALSE, 1),
  ('SORTEO_ID', 10, 20, FALSE, 2),
  ('SORTEO_ID', 15, 30, TRUE, 3),
  ('SORTEO_ID', 20, 40, FALSE, 4),
  ('SORTEO_ID', 50, 100, FALSE, 5),
  ('SORTEO_ID', 100, 200, FALSE, 6);

-- Generar tickets (del 1 al 1000)
INSERT INTO tickets (raffle_id, ticket_number, status)
SELECT
  'SORTEO_ID',
  generate_series,
  'available'
FROM generate_series(1, 1000);
```

---

**Fin del Análisis Exhaustivo**

Este documento debe actualizarse regularmente conforme avance el desarrollo.
