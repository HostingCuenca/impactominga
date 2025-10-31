# 📋 ANÁLISIS DE PENDIENTES - Proyecto Impacto Minga

**Fecha:** 2025-10-30
**Versión:** 1.0

---

## ✅ YA COMPLETADO

### Backend
- ✅ Sistema de autenticación completo (register, login, reset password)
- ✅ Gestión de sorteos (CRUD completo)
- ✅ Gestión de paquetes de precios
- ✅ Gestión de premios
- ✅ Sistema de órdenes y checkout
- ✅ Gestión de tickets
- ✅ Gestión de usuarios (CRUD completo)
- ✅ Sistema de configuración (settings)
- ✅ Endpoints de estadísticas de usuarios
- ✅ Sistema de revelación progresiva de premios
- ✅ Upload de comprobantes de pago

### Frontend
- ✅ Página pública (Index) con sorteo activo
- ✅ Carrito de compras
- ✅ Checkout inteligente (con/sin cuenta)
- ✅ Login/Register/Forgot Password
- ✅ Dashboard layout con sidebar
- ✅ Gestión de sorteos (lista, crear, editar, detalle)
- ✅ Gestión de órdenes (lista, detalle, aprobar/rechazar)
- ✅ Gestión de tickets (lista con filtros)
- ✅ Gestión de usuarios (lista, editar, cambiar estado/rol, eliminar)
- ✅ Página de configuración del sistema
- ✅ My Account (cliente)
- ✅ My Orders (cliente)
- ✅ Componente BlessedNumbers (números bendecidos)

---

## ⚠️ PENDIENTES CRÍTICOS

### 1. **Dashboard Principal - Estadísticas Reales**

**Estado:** ❌ Hardcodeado con valores en 0

**Ubicación:** `client/pages/Dashboard.tsx:23-28`

**Problema:**
```typescript
const [stats] = useState<Stats>({
  totalOrders: 0,        // ← Hardcodeado
  pendingOrders: 0,      // ← Hardcodeado
  totalRevenue: 0,       // ← Hardcodeado
  activeRaffles: 0       // ← Hardcodeado
});
```

**Qué falta:**
- [ ] Crear endpoint `GET /api/dashboard/stats` en el backend
- [ ] Calcular estadísticas reales:
  - Total de órdenes del mes
  - Órdenes pendientes de verificación
  - Ingresos totales del mes (sum de orders.total)
  - Sorteos activos (status='active')
- [ ] Fetch de datos en el frontend
- [ ] Mostrar gráficos (opcional: chart.js o recharts)

**Prioridad:** 🔴 ALTA

---

### 2. **Página de Reportes para Contadora**

**Estado:** ❌ Ruta existe pero página no

**Ubicación:** `DashboardLayout.tsx:100` → `/dashboard/reports`

**Qué falta:**
- [ ] Crear página `Reports.tsx`
- [ ] Endpoint `GET /api/reports/sales` (ventas por período)
- [ ] Endpoint `GET /api/reports/revenue` (ingresos por sorteo)
- [ ] Endpoint `GET /api/reports/receipts` (comprobantes emitidos)
- [ ] Exportar a Excel/PDF
- [ ] Filtros por fecha, sorteo, estado

**Funcionalidades requeridas:**
- 📊 Reporte de ventas diarias/mensuales
- 💰 Reporte de ingresos por sorteo
- 📄 Reporte de comprobantes emitidos
- 📈 Gráficos de ventas
- 📥 Exportación a Excel

**Prioridad:** 🟡 MEDIA-ALTA (requerido por contadora)

---

### 3. **Actividad Reciente en Dashboard**

**Estado:** ❌ Muestra mensaje vacío

**Ubicación:** `client/pages/Dashboard.tsx:158-174`

**Qué falta:**
- [ ] Endpoint `GET /api/dashboard/recent-activity`
- [ ] Mostrar últimas 10 órdenes
- [ ] Mostrar últimos tickets vendidos
- [ ] Mostrar premios desbloqueados recientemente
- [ ] Timeline de eventos

**Prioridad:** 🟡 MEDIA

---

### 4. **Estrategia de Revelación de Premios**

**Estado:** ⚠️ Implementado progresivo, falta decisión

**Ubicación:** `ESTRATEGIAS_REVELACION_PREMIOS.md`

**Situación actual:**
- ✅ Sistema progresivo funcional (revela al alcanzar % ventas)
- ❌ No hay revelación inmediata implementada

**Decisión pendiente:**
1. **Mantener progresivo** (actual)
   - Premios se revelan al alcanzar % de ventas
   - Genera suspenso

2. **Cambiar a inmediato** (recomendado por ti)
   - Todos los números ganadores visibles desde el inicio
   - Mayor transparencia y conversión

3. **Implementar híbrido**
   - Algunos premios revelados inmediatamente
   - Otros progresivamente

**Qué hacer:**
- [ ] Decidir estrategia final
- [ ] Si se elige inmediata: Modificar endpoint `/api/raffles/:id/revealed-prizes`
- [ ] Actualizar componente `BlessedNumbers.tsx`
- [ ] Documentar decisión final

**Prioridad:** 🟡 MEDIA (afecta UX y conversiones)

---

## 📊 PENDIENTES MENORES

### 5. **Página "Mis Tickets" para Cliente**

**Estado:** ❌ No existe

**Descripción:**
Cliente pueda ver todos sus números comprados y verificar si ganó algo.

**Qué falta:**
- [ ] Crear página `MyTickets.tsx`
- [ ] Ruta `/my-tickets`
- [ ] Endpoint `GET /api/customers/my-tickets`
- [ ] Mostrar:
  - Todos los tickets del cliente
  - Número de ticket
  - Sorteo asociado
  - Si es ganador o no
  - Premio ganado (si aplica)

**Prioridad:** 🟢 BAJA-MEDIA

---

### 6. **Notificaciones de Ganadores**

**Estado:** ❌ No implementado

**Descripción:**
Enviar email/notificación cuando un cliente gana un premio.

**Qué falta:**
- [ ] Sistema de emails (nodemailer o servicio externo)
- [ ] Template de email de ganador
- [ ] Trigger automático al revelar premio
- [ ] Enviar email con:
  - Número ganador
  - Premio obtenido
  - Instrucciones para reclamar

**Prioridad:** 🟢 BAJA

---

### 7. **Sistema de Comprobantes (Receipts)**

**Estado:** ⚠️ Tabla existe, funcionalidad parcial

**Ubicación:** `schema.sql:500-555` (tabla `receipts`)

**Qué falta:**
- [ ] Endpoint `POST /api/orders/:id/generate-receipt`
- [ ] Generar PDF del comprobante
- [ ] Enviar por email automáticamente
- [ ] Vista previa del comprobante
- [ ] Descargar comprobante desde "Mis Órdenes"

**Prioridad:** 🟡 MEDIA

---

### 8. **Mejoras en RaffleDetail (Admin)**

**Estado:** ✅ Funcional, faltan features

**Ubicación:** `client/pages/RaffleDetail.tsx`

**Qué falta:**
- [ ] Ver lista de ganadores del sorteo
- [ ] Asignar premios manualmente a tickets
- [ ] Generar números ganadores manualmente
- [ ] Ver estadísticas detalladas:
  - % de venta por paquete
  - Top compradores
  - Evolución de ventas (gráfico)
- [ ] Exportar lista de participantes

**Prioridad:** 🟢 BAJA

---

### 9. **Sistema de Búsqueda Global**

**Estado:** ❌ No existe

**Descripción:**
Buscar desde dashboard: órdenes, usuarios, tickets, sorteos.

**Qué falta:**
- [ ] Input de búsqueda global en header
- [ ] Endpoint `GET /api/search?q=...`
- [ ] Buscar en:
  - Órdenes por número
  - Usuarios por email/nombre
  - Tickets por número
  - Sorteos por título
- [ ] Resultados con links directos

**Prioridad:** 🟢 BAJA

---

### 10. **Logs de Auditoría**

**Estado:** ⚠️ Tabla `status_history` existe parcialmente

**Ubicación:** `schema.sql:628-650`

**Qué falta:**
- [ ] Página `AuditLogs.tsx`
- [ ] Ver todos los cambios de estado
- [ ] Filtrar por:
  - Entidad (orders, users, raffles)
  - Usuario que hizo el cambio
  - Fecha
- [ ] Exportar logs

**Prioridad:** 🟢 BAJA (útil para super_admin)

---

## 🎨 MEJORAS DE UX/UI

### 11. **Loading States y Skeletons**

**Estado:** ⚠️ Algunos implementados, faltan muchos

**Qué falta:**
- [ ] Skeleton loaders en lugar de spinners
- [ ] Loading states en botones
- [ ] Progress bars para uploads
- [ ] Transiciones suaves entre páginas

**Prioridad:** 🟢 BAJA

---

### 12. **Validaciones y Mensajes de Error**

**Estado:** ⚠️ Básicos implementados

**Qué falta:**
- [ ] Mensajes de error más descriptivos
- [ ] Validaciones de frontend antes de enviar
- [ ] Toasts en lugar de `alert()`
- [ ] Confirmaciones visuales (modals bonitos)

**Prioridad:** 🟢 BAJA-MEDIA

---

### 13. **Responsive Mobile**

**Estado:** ⚠️ Parcialmente responsive

**Qué revisar:**
- [ ] Dashboard en móvil (sidebar como drawer)
- [ ] Tablas responsivas (scroll horizontal o cards)
- [ ] Formularios en móvil
- [ ] Homepage en móvil

**Prioridad:** 🟡 MEDIA (muchos usuarios móviles)

---

## 🔒 SEGURIDAD

### 14. **Rate Limiting**

**Estado:** ❌ No implementado

**Qué falta:**
- [ ] Rate limiting en endpoints públicos
- [ ] Protección contra brute force en login
- [ ] Captcha en registro (opcional)

**Prioridad:** 🟡 MEDIA

---

### 15. **Sanitización de Inputs**

**Estado:** ⚠️ Básico con SQL parametrizado

**Qué revisar:**
- [ ] Validar todos los inputs en backend
- [ ] Sanitizar HTML en descripciones
- [ ] Validar tipos de archivos en uploads
- [ ] Límite de tamaño de uploads

**Prioridad:** 🟡 MEDIA

---

## 📱 FEATURES ADICIONALES

### 16. **Integración con Pasarelas de Pago**

**Estado:** ❌ No implementado (solo transferencia)

**Opciones:**
- [ ] PayPhone (Ecuador)
- [ ] Kushki
- [ ] Stripe (internacional)

**Prioridad:** 🟡 MEDIA (aumentaría conversiones)

---

### 17. **Sistema de Referidos**

**Estado:** ❌ No implementado

**Descripción:**
Cliente puede compartir link de referido y ganar descuentos/bonos.

**Prioridad:** 🟢 BAJA

---

### 18. **WhatsApp Integration**

**Estado:** ⚠️ Link existe, falta automatización

**Qué falta:**
- [ ] Botón de WhatsApp flotante en homepage
- [ ] Mensaje automático con número de orden
- [ ] Notificaciones de estado por WhatsApp (API Business)

**Prioridad:** 🟢 BAJA

---

## 🧪 TESTING Y QA

### 19. **Tests**

**Estado:** ❌ No existen

**Qué falta:**
- [ ] Unit tests (backend endpoints)
- [ ] Integration tests
- [ ] E2E tests con Cypress/Playwright
- [ ] Test coverage mínimo 70%

**Prioridad:** 🟢 BAJA (bueno tener, no crítico)

---

### 20. **Logging y Monitoring**

**Estado:** ❌ Solo console.log

**Qué falta:**
- [ ] Winston/Pino para logging estructurado
- [ ] Sentry para error tracking
- [ ] Monitoring de performance
- [ ] Health check endpoint

**Prioridad:** 🟢 BAJA

---

## 📦 DEPLOYMENT Y DEVOPS

### 21. **CI/CD Pipeline**

**Estado:** ❌ No existe

**Qué falta:**
- [ ] GitHub Actions o GitLab CI
- [ ] Build automático
- [ ] Deploy automático a staging/prod
- [ ] Rollback automático si falla

**Prioridad:** 🟢 BAJA

---

### 22. **Documentación**

**Estado:** ⚠️ Parcial (este archivo + schema.sql)

**Qué falta:**
- [ ] README completo con setup
- [ ] Documentación de API (Swagger/Postman)
- [ ] Diagramas de arquitectura
- [ ] Manual de usuario para admins

**Prioridad:** 🟢 BAJA-MEDIA

---

## 🎯 RESUMEN DE PRIORIDADES

### 🔴 ALTA PRIORIDAD (Hacer ahora)
1. Dashboard principal con estadísticas reales
2. Página de Reportes para contadora

### 🟡 MEDIA PRIORIDAD (Siguiente sprint)
3. Estrategia de revelación de premios (decisión + implementación)
4. Sistema de comprobantes (PDF + email)
5. Responsive mobile
6. Mejoras de seguridad (rate limiting, validaciones)

### 🟢 BAJA PRIORIDAD (Backlog)
7. Página "Mis Tickets" para cliente
8. Notificaciones de ganadores
9. Mejoras en RaffleDetail
10. Búsqueda global
11. Logs de auditoría
12. Loading states
13. Integración con pasarelas
14. Testing
15. Documentación completa

---

## 📝 NOTAS FINALES

**Sistema está 80% completo.**

**Para lanzar a producción se necesita mínimo:**
1. ✅ Dashboard con stats reales
2. ✅ Página de reportes básica
3. ✅ Decidir estrategia de premios
4. ✅ Responsive mobile mejorado
5. ✅ Rate limiting básico

**El resto son mejoras progresivas que se pueden implementar después del lanzamiento.**

---

**Última actualización:** 2025-10-30
**Mantenedor:** Claude Code
