# JF Studio Salon

Sistema integral para un salon de belleza: landing publica, reservas en linea, agenda por staff, clientes, historial, inventario, caja, reportes y notificaciones por email.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Autenticacion propia por contraseña + cookie (`ADMIN_PASSWORD`)
- Resend (emails transaccionales)
- Tailwind CSS con sistema de tokens propio
- Vitest para tests

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables de entorno:

```bash
cp .env.example .env.local
```

3. Configura `DATABASE_URL` con un PostgreSQL accesible (Railway, Neon, Supabase, local).

4. Crea el esquema y datos iniciales:

```bash
npm run db:migrate
npm run db:seed
```

5. Ejecuta la app:

```bash
npm run dev
```

## Variables de entorno

| Variable | Obligatoria | Descripcion |
|----------|-------------|-------------|
| `DATABASE_URL` | siempre | Cadena de conexion PostgreSQL. |
| `ADMIN_PASSWORD` | en produccion | Contraseña del panel administrativo. En dev, si no esta definida, el panel queda abierto. |
| `NEXT_PUBLIC_APP_URL` | en produccion | URL publica (https://...). Usada en links de emails y metadata SEO. |
| `RESEND_API_KEY` | para emails | API key de Resend. |
| `EMAIL_FROM` | para emails | Remitente de emails (formato: `"Nombre <correo@dominio>"`). |
| `ADMIN_EMAIL` | para emails | Correo de la administradora (recibe alertas de nuevas reservas y el respaldo diario). |
| `CRON_SECRET` | para cron | Token compartido para autorizar `/api/cron/reminders` y `/api/cron/backup`. |

## Autenticacion del panel admin

El panel usa autenticacion propia sin dependencias externas:

- **Contraseña**: se define en `ADMIN_PASSWORD`. Se guarda como hash SHA-256 en el servidor; nunca viaja en claro.
- **Sesion**: al hacer login se emite una cookie `admin_session` (HttpOnly, Secure en produccion) con validez de 30 dias.
- **Modo desarrollo**: si `ADMIN_PASSWORD` no esta definida y `NODE_ENV !== "production"`, el panel queda abierto sin login para facilitar el desarrollo local.
- **Cambio de contraseña**: desde **Configuracion → Seguridad** en el propio panel, o redefiniendo `ADMIN_PASSWORD` en las variables de entorno y reiniciando.

## Roles

| Rol | Permisos |
|-----|----------|
| `ADMIN` | Acceso total. |
| `STYLIST` | Ve sus propias citas, marca como completada, cobra (en sus citas). |
| `RECEPTIONIST` | Crea/edita citas y clientes, cobra, ve caja del dia. |

## Resend (emails)

Confirmaciones de reserva, recordatorios 24h antes y avisos de cancelacion se envian con Resend.

1. Crea cuenta en [resend.com](https://resend.com).
2. Verifica tu dominio.
3. Crea una API key y guardala en `RESEND_API_KEY`.
4. Define `EMAIL_FROM` con un remitente verificado (ej: `"JF Studio <hola@jfstudio.pe>"`).

## Cron de recordatorios

El endpoint `POST /api/cron/reminders` busca citas confirmadas en las proximas 24h y envia recordatorios. Debe llamarse cada hora con header `Authorization: Bearer ${CRON_SECRET}`.

Opciones recomendadas:
- GitHub Actions con `schedule`.
- Servicio externo (cron-job.org) apuntando al endpoint.
- Plataforma con cron nativo (Vercel Cron, Railway con plan que lo soporte).

## Respaldo de la base de datos

Toda la informacion del negocio vive en la base PostgreSQL. El respaldo tiene varias capas
para no depender solo de Railway:

1. **Backups nativos de Railway** (recomendado activar): en el dashboard de Railway, servicio
   Postgres → pestana **Backups**, habilita los snapshots automaticos. Es la primera linea,
   pero vive dentro de Railway.

2. **Respaldo automatico diario fuera de Railway** — endpoint `GET /api/cron/backup`,
   protegido con `Authorization: Bearer ${CRON_SECRET}` (mismo mecanismo que el cron de
   recordatorios). Genera el respaldo y lo saca de Railway por dos vias independientes:
   - **Correo** a `ADMIN_EMAIL` con el `.json.gz` (restaurable) y el `.xlsx` (legible) adjuntos.
     Define ademas `BACKUP_EMAIL` (opcional, varios separados por coma) para que el respaldo
     llegue tambien al desarrollador/proveedor, no solo a la duena.
   - **Subida a S3/R2** bajo `backups/<año>/` (usa las mismas `DEPOSIT_S3_*` de los comprobantes).

   Configura un disparo **diario** a ese endpoint con el mismo metodo que ya usas para
   `/api/cron/reminders` (GitHub Actions / cron-job.org / cron nativo).

3. **Descarga manual** desde el panel: **Configuracion → Respaldo**. Dos botones para bajar el
   archivo de datos (`.json.gz`) o el Excel legible a la PC. La pagina muestra un recordatorio
   diario y, en Chrome/Edge de escritorio, permite conectar una carpeta para guardado automatico.

### Restaurar un respaldo

Reconstruye el negocio en una base **nueva/vacia** (p. ej. otro proveedor de Postgres) a partir
de un `.json` o `.json.gz`:

```bash
# apunta DATABASE_URL a la base nueva y ejecuta:
npm run db:restore -- ruta/al/respaldo-jfstudio-2026-06-02.json.gz
```

Por seguridad se niega a escribir sobre una base que ya tiene datos; usa `--force` para forzar.

## Deploy en Railway

```bash
npm install
npm run build   # incluye prisma generate + next build + standalone prep
npm run start
```

Variables minimas en Railway:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_EMAIL`
- `CRON_SECRET`

Las migraciones corren solas: `npm run build` ejecuta `prisma migrate deploy` antes de compilar, asi
que cada deploy deja la base al dia sin pasos manuales. Si el build falla ahi, es que `DATABASE_URL`
no esta disponible en el entorno de build — revisa las variables antes de tocar el script.

## Tests

```bash
npm test
```

Cubre logica de scheduling (overlaps, breaks) y resumenes de caja.
