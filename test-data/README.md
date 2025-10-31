# Guía para Probar los Endpoints de Raffles

Esta carpeta contiene archivos JSON para probar la creación de un sorteo completo usando Postman, cURL, o cualquier cliente HTTP.

## Prerrequisitos

1. El servidor debe estar corriendo en `http://localhost:8080`
2. La base de datos PostgreSQL debe estar conectada

## Paso 1: Crear el Sorteo

**Endpoint:** `POST http://localhost:8080/api/raffles`
**Headers:**
```
Content-Type: application/json
```

**Body:** Usar el contenido de `01-create-raffle.json`

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/raffles \
  -H "Content-Type: application/json" \
  -d @test-data/01-create-raffle.json
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Sorteo creado exitosamente",
  "data": {
    "id": "uuid-del-sorteo",
    "title": "SORTEO TOYOTA COROLLA 2024",
    "slug": "sorteo-toyota-corolla-2024",
    ...
  }
}
```

**IMPORTANTE:** Guarda el `id` del sorteo que te devuelve la respuesta. Lo necesitarás para los siguientes pasos.

---

## Paso 2: Crear Paquetes de Precios

**Endpoint:** `POST http://localhost:8080/api/raffles/{RAFFLE_ID}/packages`
**Headers:**
```
Content-Type: application/json
```

**Body:** Usar el contenido de `02-create-packages.json`

**Ejemplo cURL:**
```bash
# Reemplaza {RAFFLE_ID} con el ID que obtuviste en el paso 1
curl -X POST http://localhost:8080/api/raffles/{RAFFLE_ID}/packages \
  -H "Content-Type: application/json" \
  -d @test-data/02-create-packages.json
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "6 paquetes creados exitosamente",
  "data": [...]
}
```

---

## Paso 3: Crear Premios

**Endpoint:** `POST http://localhost:8080/api/raffles/{RAFFLE_ID}/prizes`
**Headers:**
```
Content-Type: application/json
```

**Body:** Usar el contenido de `03-create-prizes.json`

**Ejemplo cURL:**
```bash
# Reemplaza {RAFFLE_ID} con el ID que obtuviste en el paso 1
curl -X POST http://localhost:8080/api/raffles/{RAFFLE_ID}/prizes \
  -H "Content-Type: application/json" \
  -d @test-data/03-create-prizes.json
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "5 premios creados exitosamente",
  "data": [...]
}
```

---

## Paso 4: Verificar que Todo se Creó Correctamente

### Listar todos los sorteos activos
```bash
curl http://localhost:8080/api/raffles
```

### Ver detalle del sorteo
```bash
curl http://localhost:8080/api/raffles/{RAFFLE_ID}
```

### Ver paquetes del sorteo
```bash
curl http://localhost:8080/api/raffles/{RAFFLE_ID}/packages
```

### Ver premios del sorteo
```bash
curl http://localhost:8080/api/raffles/{RAFFLE_ID}/prizes
```

---

## Usar Postman

### Importar colección (Opción recomendada)

1. Abre Postman
2. Crea una nueva Collection llamada "Impacto Minga"
3. Agrega las siguientes requests:

#### Request 1: Crear Sorteo
- Method: POST
- URL: `http://localhost:8080/api/raffles`
- Headers: `Content-Type: application/json`
- Body (raw JSON): Pega el contenido de `01-create-raffle.json`

#### Request 2: Crear Paquetes
- Method: POST
- URL: `http://localhost:8080/api/raffles/{{raffleId}}/packages`
- Headers: `Content-Type: application/json`
- Body (raw JSON): Pega el contenido de `02-create-packages.json`
- Variables: Crea una variable `raffleId` en la collection

#### Request 3: Crear Premios
- Method: POST
- URL: `http://localhost:8080/api/raffles/{{raffleId}}/prizes`
- Headers: `Content-Type: application/json`
- Body (raw JSON): Pega el contenido de `03-create-prizes.json`

#### Request 4: Listar Sorteos
- Method: GET
- URL: `http://localhost:8080/api/raffles`

---

## Notas Importantes

1. **Orden de ejecución**: SIEMPRE ejecuta en este orden:
   - Primero crear el sorteo
   - Luego los paquetes
   - Finalmente los premios

2. **IDs**: Los paquetes y premios necesitan el ID del sorteo padre.

3. **Fechas**: Las fechas en el JSON están en formato ISO 8601 (UTC).

4. **Validaciones**:
   - El `activityNumber` debe ser único
   - El `slug` se genera automáticamente del título
   - Los campos `totalTickets` y `ticketPrice` deben ser mayores a 0

5. **Errores comunes**:
   - Si obtienes error 404 en packages/prizes, verifica que el `raffleId` sea correcto
   - Si obtienes error de duplicado, cambia el `activityNumber` o el `title`

---

## Verificación en la Base de Datos

Puedes verificar directamente en PostgreSQL:

```sql
-- Ver sorteos creados
SELECT * FROM raffles;

-- Ver paquetes de un sorteo
SELECT * FROM pricing_packages WHERE raffle_id = 'uuid-del-sorteo';

-- Ver premios de un sorteo
SELECT * FROM prizes WHERE raffle_id = 'uuid-del-sorteo';

-- Ver conteo completo
SELECT
  r.title,
  COUNT(DISTINCT pp.id) as num_packages,
  COUNT(DISTINCT p.id) as num_prizes
FROM raffles r
LEFT JOIN pricing_packages pp ON pp.raffle_id = r.id
LEFT JOIN prizes p ON p.raffle_id = r.id
GROUP BY r.id, r.title;
```

---

## Siguiente Paso

Una vez que hayas creado el sorteo con estos endpoints, puedes:

1. Verificar que aparezca en `GET /api/raffles`
2. Conectar el frontend (Homepage) con esta API
3. Ver los datos reales en la interfaz de usuario

¡Feliz testing! 🎉
