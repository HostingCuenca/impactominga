# Configuración de Nginx para Servidor Oracle Cloud

## Problema Actual
Cuando se accede a `impactominga.com`, Nginx está sirviendo la API de `med-api` en lugar del frontend de Impacto Minga.

## Causa
Los bloques `server` con `server_name 159.112.148.177` están capturando TODAS las peticiones porque actúan como default.

## Solución

### Opción 1: Mantener TODO en un solo archivo `/etc/nginx/sites-available/mediconsa`

Esta opción NO es recomendada porque mezcla dos aplicaciones diferentes.

---

### ✅ Opción 2 (RECOMENDADA): Separar en dos archivos

#### Archivo 1: `/etc/nginx/sites-available/mediconsa`

```nginx
# Med API - Dominio con SSL
server {
    server_name api.drmediconsa.com;

    access_log /var/log/nginx/api.drmediconsa.com.access.log;
    error_log /var/log/nginx/api.drmediconsa.com.error.log;

    location / {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/api.drmediconsa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.drmediconsa.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Redirección HTTP a HTTPS para mediconsa
server {
    listen 80;
    server_name api.drmediconsa.com;
    return 301 https://$server_name$request_uri;
}
```

---

#### Archivo 2: `/etc/nginx/sites-available/impactominga`

```nginx
# Impacto Minga - Puerto 80 (HTTP)
server {
    listen 80;
    server_name impactominga.com www.impactominga.com;

    access_log /var/log/nginx/impactominga.access.log;
    error_log /var/log/nginx/impactominga.error.log;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Impacto Minga - Puerto 443 (HTTPS via Cloudflare)
server {
    listen 443 ssl http2;
    server_name impactominga.com www.impactominga.com;

    access_log /var/log/nginx/impactominga.access.log;
    error_log /var/log/nginx/impactominga.error.log;

    # Certificado temporal (Cloudflare maneja el SSL real)
    ssl_certificate /etc/letsencrypt/live/api.drmediconsa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.drmediconsa.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## Comandos para Implementar la Opción 2

```bash
# 1. Editar mediconsa para QUITAR los bloques de IP (159.112.148.177)
sudo nano /etc/nginx/sites-available/mediconsa
# (Reemplaza con el contenido del "Archivo 1" de arriba)

# 2. Editar impactominga
sudo nano /etc/nginx/sites-available/impactominga
# (Reemplaza con el contenido del "Archivo 2" de arriba)

# 3. Asegurar que impactominga esté activado
sudo ln -sf /etc/nginx/sites-available/impactominga /etc/nginx/sites-enabled/

# 4. Verificar configuración
sudo nginx -t

# 5. Recargar Nginx
sudo systemctl reload nginx

# 6. Probar
curl -I http://impactominga.com
curl -I https://impactominga.com
```

---

## Resultado Esperado

### Cuando alguien accede a:
- `api.drmediconsa.com` → Nginx sirve `med-api` (puerto 5001)
- `impactominga.com` → Nginx sirve `impacto-minga` (puerto 8080)
- `159.112.148.177` directamente → No tendrá configuración específica (opcional agregar default)

---

## Notas Importantes

1. **SSL**: Impactominga usa SSL de Cloudflare, por eso usamos el certificado de mediconsa temporalmente
2. **Puertos**:
   - Med API: 5001
   - Impacto Minga: 8080
3. **PM2**:
   - `pm2 list` debe mostrar ambas apps corriendo
4. **Cloudflare**:
   - Debe tener DNS tipo A apuntando a 159.112.148.177
   - SSL mode: "Full"

---

## Troubleshooting

Si después de aplicar los cambios `impactominga.com` sigue mostrando med-api:

```bash
# Ver qué configuración está usando Nginx
sudo nginx -T | grep -A 20 "server_name impactominga.com"

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/impactominga.access.log
sudo tail -f /var/log/nginx/impactominga.error.log

# Verificar que PM2 esté corriendo en el puerto correcto
pm2 logs impacto-minga | grep "port"
netstat -tlnp | grep 8080
```

---

## RESPALDO - Configuración Original de Mediconsa

**Antes de hacer cambios, guarda esto como respaldo:**

### Archivo Original: `/etc/nginx/sites-available/mediconsa`

```nginx
server {
    server_name api.drmediconsa.com;

    access_log /var/log/nginx/api.drmediconsa.com.access.log;
    error_log /var/log/nginx/api.drmediconsa.com.error.log;

    location / {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Server $server_name;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para mejor performance
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Opciones para mejorar performance
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }

    listen 443 ssl http2; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.drmediconsa.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/api.drmediconsa.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    listen 80;
    server_name 159.112.148.177;

    location / {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para APIs
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

server {
    listen 443 ssl http2;
    server_name 159.112.148.177;

    # Usar el mismo certificado del dominio
    ssl_certificate /etc/letsencrypt/live/api.drmediconsa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.drmediconsa.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para APIs
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Redirección HTTP a HTTPS para el dominio
server {
    listen 80;
    server_name api.drmediconsa.com;

    # Redirección permanente a HTTPS
    return 301 https://$server_name$request_uri;
}
```

### Comandos para Crear Respaldo Antes de Modificar

```bash
# Crear respaldo con fecha
sudo cp /etc/nginx/sites-available/mediconsa /etc/nginx/sites-available/mediconsa.backup.$(date +%Y%m%d)

# Verificar que se creó el respaldo
ls -la /etc/nginx/sites-available/mediconsa*
```

### Para Restaurar el Respaldo (si algo sale mal)

```bash
# Restaurar desde el respaldo
sudo cp /etc/nginx/sites-available/mediconsa.backup.YYYYMMDD /etc/nginx/sites-available/mediconsa

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```
