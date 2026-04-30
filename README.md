# JF Studio Salon

Sistema integral para un salon de belleza: landing publica, reservas en linea, agenda por staff, clientes, historial, inventario, caja, reportes y notificaciones por email.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Clerk (autenticacion del panel administrativo)
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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | en produccion | Clave publica de Clerk. |
| `CLERK_SECRET_KEY` | en produccion | Clave secreta de Clerk. |
| `CLERK_WEBHOOK_SECRET` | en produccion | Secret del webhook Clerk para sincronizar usuarios con Staff. |
| `NEXT_PUBLIC_APP_URL` | en produccion | URL publica (https://...). Usada en links de emails y metadata SEO. |
| `RESEND_API_KEY` | para emails | API key de Resend. |
| `EMAIL_FROM` | para emails | Remitente de emails (formato: `"Nombre <correo@dominio>"`). |
| `CRON_SECRET` | para cron | Token compartido para autorizar `/api/cron/reminders`. |

## Clerk

- En desarrollo, si Clerk no esta configurado, el panel admin queda accesible para facilitar la implementacion local (modo `local-dev`).
- En produccion se requiere `CLERK_SECRET_KEY` y `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

### Webhook Clerk -> Staff

El endpoint `/api/webhooks/clerk` sincroniza usuarios de Clerk con la tabla `Staff` automaticamente:

1. En el dashboard de Clerk crea un webhook apuntando a `https://TU_DOMINIO/api/webhooks/clerk`.
2. Suscribe los eventos `user.created`, `user.updated` y `user.deleted`.
3. Copia el `Signing Secret` y guardalo como `CLERK_WEBHOOK_SECRET`.

Por defecto los usuarios nuevos se crean con rol `RECEPTIONIST`. Para promoverlos a `ADMIN`/`STYLIST`, edita el campo `public_metadata.role` en Clerk con el valor (`ADMIN`, `STYLIST` o `RECEPTIONIST`) y actualiza el usuario; el webhook propaga el cambio.

Para probar el webhook en local, expon el puerto con `cloudflared tunnel` o `ngrok` y registra esa URL temporalmente en Clerk.

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

## Deploy en Railway

```bash
npm install
npm run build   # incluye prisma generate + next build + standalone prep
npm run start
```

Variables minimas en Railway:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`

Antes del primer deploy, conecta a la base con `prisma migrate deploy` (o agrega ese paso al script de build).

## Tests

```bash
npm test
```

Cubre logica de scheduling (overlaps, breaks) y resumenes de caja.
