# Food Stall Presentation - Audio Tour Guide

Production-ready monorepo for a location-based audio guide system used in food
stalls, exhibitions, fairs, and tourist spaces. The platform lets visitors
discover points of interest (POIs), hear automatic audio narration based on GPS
proximity or QR scanning, while merchants manage their POIs and administrators
operate tours, approvals, analytics, and live monitoring.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database Workflow](#database-workflow)
- [Build and Production Run](#build-and-production-run)
- [API Surface](#api-surface)
- [Operational Notes](#operational-notes)
- [Quality Gates](#quality-gates)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## Overview

The system is composed of three client-facing surfaces and one backend service:

- Visitor mobile app: Expo/React Native app for browsing tours, tracking
  position, scanning QR codes, and playing audio narration.
- Merchant portal: Web dashboard for food stall owners to manage POIs, media,
  audio content, and analytics.
- Admin dashboard: Web console for user management, POI approval, tour
  management, global analytics, and real-time monitoring.
- Backend API: Express/TypeScript service that handles authentication, RBAC,
  POI/tour APIs, uploads, TTS preview, Prisma/MySQL data access, and Socket.IO
  monitoring.

## Architecture

```text
mobile/ Expo app
  -> REST API /api/v1
  -> GPS, QR, audio playback, local audio cache

frontend/ React dashboard
  -> REST API /api/v1
  -> Socket.IO /socket.io for admin monitoring

backend/ Express API
  -> Prisma ORM
  -> MySQL
  -> uploads/
  -> mail provider
  -> Google Translate/TTS services
```

Default local endpoints:

- Backend API: `http://localhost:3000/api/v1`
- Health check: `http://localhost:3000/health`
- Web dashboard: `http://localhost:5173`
- Socket.IO path: `/socket.io`

## Tech Stack

| Area | Stack |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, Prisma, MySQL, Socket.IO |
| Backend security | Helmet, CORS allowlist, rate limiting, JWT, bcrypt, request validation |
| Web frontend | React 19, Vite, TypeScript, Ant Design, React Router, Zustand |
| Maps and charts | Leaflet, React Leaflet, Chart.js, react-chartjs-2 |
| Mobile | Expo 54, React Native 0.81, Expo Router, TypeScript |
| Mobile capabilities | Location, camera/QR scan, maps, audio playback, file cache |
| Services | Nodemailer, Google Translate/TTS packages, multer uploads |

## Repository Structure

```text
.
|-- backend/          Express API, Prisma schema, migrations, seed data
|-- frontend/         Admin and merchant web dashboard
|-- mobile/           Visitor mobile app built with Expo
|-- docs/             Architecture notes, diagrams, monitoring docs, reports
|-- specs/            Supporting specifications
|-- prd.md            Product requirements document
|-- README.md         Project-level operational guide
```

Important backend paths:

- `backend/src/server.ts` - HTTP server bootstrap and graceful shutdown.
- `backend/src/app.ts` - Express app, middleware, health check, API mounting.
- `backend/src/routes/` - API route modules.
- `backend/src/config/` - environment, database, mail, and socket config.
- `backend/prisma/schema/` - Prisma schema split by domain.
- `backend/prisma/seed.ts` - development seed data.

## Prerequisites

Install these before running the project:

- Node.js 22.x recommended.
- npm 10.x or newer.
- MySQL 8.x.
- Expo CLI through `npx expo ...` for the mobile app.
- Android Studio or Xcode when testing native mobile targets.

## Environment Variables

Never commit real `.env` files. Use the examples as templates.

### Backend

Create `backend/.env` from `backend/.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `production`, or `test`. |
| `PORT` | Yes | API port, defaults to `3000`. |
| `HOST` | Yes | Bind host, commonly `0.0.0.0`. |
| `PUBLIC_API_BASE_URL` | Yes | Public backend origin used in logs, media, QR, and mobile flows. |
| `DATABASE_URL` | Yes | MySQL connection string used by Prisma. |
| `JWT_SECRET` | Yes | Strong signing secret, at least 32 characters. |
| `JWT_EXPIRES_IN` | No | JWT lifetime, defaults to `7d`. |
| `UPLOAD_DIR` | No | Upload folder, defaults to `uploads`. |
| `MAX_FILE_SIZE_MB` | No | Upload size limit. |
| `ALLOWED_FILE_TYPES` | No | Comma-separated MIME allowlist. |
| `MAIL_HOST` | No | SMTP host. |
| `MAIL_PORT` | No | SMTP port. |
| `MAIL_SECURE` | No | `true` for TLS SMTP. |
| `MAIL_USER` | No | SMTP username. |
| `MAIL_PASS` | No | SMTP password or app password. |
| `MAIL_FROM` | No | Sender identity. |
| `FRONTEND_URL` | Yes | Primary web frontend origin. |
| `CORS_ORIGINS` | No | Extra allowed origins, comma-separated. |
| `MAX_CONCURRENT_SESSIONS` | No | Monitoring capacity threshold base. |
| `MONITORING_WARNING_THRESHOLD_PERCENT` | No | Monitoring warning threshold. |
| `RATE_LIMIT_WINDOW_MS` | No | Global rate-limit window. |
| `RATE_LIMIT_MAX_REQUESTS` | No | Global request limit. |
| `AUTH_RATE_LIMIT_MAX` | No | Auth endpoint request limit. |

### Frontend

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:3000/api/v1
```

For production, set this to the public HTTPS API URL.

### Mobile

Create `mobile/.env` when a fixed API URL is needed:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

The mobile app normalizes the value to include `/api/v1`. During development it
also tries Expo host, Android emulator host `10.0.2.2`, and localhost fallback.

## Local Development

Install dependencies per package:

```bash
cd backend
npm ci

cd ../frontend
npm ci

cd ../mobile
npm ci
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the web dashboard:

```bash
cd frontend
npm run dev
```

Start the mobile app:

```bash
cd mobile
npm run start
```

Common mobile alternatives:

```bash
npm run android
npm run ios
npm run web
npm run start:clear
```

## Database Workflow

Generate Prisma client:

```bash
cd backend
npm run prisma:generate
```

Apply development migrations:

```bash
npm run prisma:migrate
```

Seed development data:

```bash
npm run seed
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

Production migration command:

```bash
cd backend
npx prisma migrate deploy
```

Core data model:

- `Role`, `User`, `PasswordResetOtp`
- `Merchant`
- `PointOfInterest`, `PoiAudio`
- `Tour`, `TourPoi`
- `UserSession`, `AudioPlayHistory`

## Build and Production Run

Backend:

```bash
cd backend
npm run build
npm run start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

Mobile:

```bash
cd mobile
npm run start
```

For distributable mobile builds, configure the Expo/EAS release workflow for
the target environment and make sure `EXPO_PUBLIC_API_URL` points to the public
HTTPS backend.

## API Surface

All versioned API routes are mounted under `/api/v1`.

| Route group | Purpose |
| --- | --- |
| `/auth` | Login, register, profile, password flows. |
| `/auth/otp` | OTP-based auth and password reset flows. |
| `/admin` | Admin dashboard APIs for users, POIs, tours, analytics, monitoring. |
| `/merchant` | Merchant POI and analytics APIs. |
| `/tourist` | Visitor tour, POI, session, routing, and heartbeat APIs. |
| `/upload` | File upload endpoints. |
| `/tts` | TTS preview and audio generation helpers. |
| `/health` | Unversioned service health check. |

## Operational Notes

Production checklist:

- Set `NODE_ENV=production`.
- Use a strong unique `JWT_SECRET`.
- Serve backend and frontend over HTTPS.
- Set `PUBLIC_API_BASE_URL` to the public backend origin.
- Set `FRONTEND_URL` and `CORS_ORIGINS` to exact allowed origins.
- Run `npx prisma migrate deploy` before starting the API.
- Persist `backend/uploads` outside ephemeral container storage.
- Configure SMTP credentials for OTP and password reset emails.
- Make sure reverse proxy supports WebSocket upgrades for `/socket.io`.
- Monitor `/health`, application logs, database connectivity, and disk usage.
- Keep production seed/demo credentials out of live environments.

Reverse proxy requirements:

- Forward `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`.
- Preserve `Authorization` and `Content-Type` headers.
- Allow WebSocket upgrade for Socket.IO.
- Set request body limits compatible with backend upload limits.

## Quality Gates

Backend build:

```bash
cd backend
npm run build
```

Backend monitoring test, when the related test file is present:

```bash
cd backend
npm run test:monitoring
```

Frontend lint and build:

```bash
cd frontend
npm run lint
npm run build
```

Mobile TypeScript check:

```bash
cd mobile
npx tsc --noEmit
```

## Troubleshooting

Mobile cannot connect to API:

- Use the computer LAN IP in `EXPO_PUBLIC_API_URL`, not `localhost`, when
  testing on a physical phone.
- Use `http://10.0.2.2:3000` for Android emulator if needed.
- Confirm backend is bound to `HOST=0.0.0.0`.
- Confirm firewall allows traffic to `PORT=3000`.

Frontend gets CORS errors:

- Add the frontend origin to `FRONTEND_URL` or `CORS_ORIGINS`.
- Restart the backend after changing environment variables.

Prisma cannot connect:

- Verify MySQL is running.
- Check `DATABASE_URL` credentials, database name, host, and port.
- Run `npm run prisma:generate` after schema or environment changes.

Uploads are missing after deploy:

- Mount `backend/uploads` to persistent storage.
- Set `UPLOAD_DIR` consistently across deploys.
- Confirm reverse proxy serves or forwards `/uploads`.

Socket monitoring does not update:

- Confirm `/socket.io` is reachable from the frontend.
- Enable WebSocket upgrade headers in the reverse proxy.
- Confirm the logged-in user has the `admin` role.

## Documentation

Additional project documents:

- `prd.md` - Product requirements and feature scope.
- `docs/01-database-schema-analysis.md` - Database schema analysis.
- `docs/02-feature-database-mapping.md` - Feature-to-database mapping.
- `docs/03-improvement-proposals.md` - Improvement proposals.
- `docs/04-azure-speech-integration-plan.md` - Speech integration plan.
- `docs/05-assumptions-constraints.md` - Assumptions and constraints.
- `docs/poi-publish-flow.md` - POI audio publish flow.
- `docs/monitoring/monitoring-flow-documentation.md` - Monitoring architecture.
- `docs/monitoring/monitoring-tts-audio-flow-spec.md` - Monitoring/TTS audio spec.
