# PPAM BAQ

Aplicación web para la gestión de solicitudes de participación en la predicación pública (PPAM — Predicación Pública y Aprovechamiento del Ministerio) del área metropolitana de Barranquilla.

## Stack técnico

- **Frontend**: Angular 22 (standalone components, signals), TypeScript.
- **Backend**: NestJS + TypeScript (arquitectura por módulos: controllers → services → repositories).
- **Base de datos / plataforma**: Supabase (PostgreSQL, Auth, Storage), con Row Level Security habilitado en todas las tablas de negocio.
- **Autenticación**: JWT propio emitido por el backend, validado contra la tabla `usuarios` (bcrypt).

Las reglas de arquitectura, diseño y UX del proyecto están documentadas en [`CLAUDE.md`](CLAUDE.md) y [`DESIGN PPAM.md`](DESIGN%20PPAM.md).

## Estructura del repositorio

```
backend/    API REST en NestJS
frontend/   Aplicación Angular
supabase/   Tipos generados de la base de datos
```

## Requisitos previos

- Node.js 20+ y npm
- Un proyecto de Supabase (URL + claves) ya creado, con el esquema de base de datos correspondiente

## Configuración

1. Backend: copiar `backend/.env.example` a `backend/.env` y completar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (mínimo 32 caracteres) y, si se quiere habilitar el envío de correos ("Recordar contraseña"), las variables `SMTP_*`.
2. Frontend: la URL base de la API se configura en `frontend/src/environments/`.

## Cómo correr el proyecto en desarrollo

```bash
# Backend (http://localhost:3000)
cd backend
npm install
npm run start:dev

# Frontend (http://localhost:4200)
cd frontend
npm install
npm start
```

## Scripts útiles

| Comando (dentro de cada carpeta) | Descripción |
| --- | --- |
| `npm run start:dev` (backend) | Levanta la API en modo watch |
| `npm run build` (backend/frontend) | Compila para producción |
| `npm test` (backend/frontend) | Corre las pruebas unitarias |
