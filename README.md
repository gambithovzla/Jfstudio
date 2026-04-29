# JF Studio Salon

MVP de gestion integral para un salon de belleza: reservas publicas, agenda por staff, clientes, historial, inventario y caja.

## Stack

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Clerk para acceso administrativo
- Tailwind CSS con componentes locales estilo shadcn/ui

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables:

```bash
copy .env.example .env.local
```

3. Configura `DATABASE_URL` con Railway Postgres, Neon o cualquier PostgreSQL compatible.

4. Crea la base y datos iniciales:

```bash
npm run db:migrate
npm run db:seed
```

5. Ejecuta la app:

```bash
npm run dev
```

## Clerk

Para proteger `/admin`, configura:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

En desarrollo, si Clerk no esta configurado, el panel admin queda accesible para facilitar la implementacion local. En produccion se deben configurar las variables de Clerk antes de desplegar.

## Railway

Usa estos comandos:

```bash
npm install
npm run build
npm run start
```

Variables minimas en Railway:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
