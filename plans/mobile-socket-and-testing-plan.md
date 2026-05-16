# Plan: Public Monitoring Page + Mobile Socket Lifecycle

## 1. Goals

- Move monitoring out of the admin dashboard into a dedicated web page.
- Show richer monitoring details:
  - realtime summary counters,
  - currently active devices,
  - full recent activity/logging history,
  - socket connection state and connection events.
- Make mobile update active/inactive state in less than 1 minute when the user exits or backgrounds the app.
- Do not depend on LAN IPs. Mobile and web must use the public API origin from env config.
- Verify socket connections do not fall back to `ws://localhost:3000` when a public backend is configured.

## 2. Backend Changes

### 2.1 Connection Tracker

Update `backend/src/services/monitoring/connection-tracker.service.ts`:

- Reduce stale timeout from 5 minutes to a value below 1 minute.
- Use a cleanup interval shorter than the stale timeout.
- Store connection source metadata:
  - `source`: `rest` or `socket`,
  - `socketId`,
  - `origin`,
  - `transport`,
  - `connectedAt`,
  - `lastActivity`.

Recommended values:

- REST/mobile heartbeat interval: 30 seconds.
- Socket heartbeat interval: 25 seconds.
- Backend stale timeout: 45 seconds.
- Cleanup interval: 15 seconds.

This makes inactive devices disappear within about 45-60 seconds even if the app closes without a clean REST `end` call.

### 2.2 Socket Logging

Update `backend/src/config/socket.ts`:

- Log socket connection attempts with origin, transport, and socket id.
- Log mobile socket registration when `device:heartbeat` includes `sessionId`.
- Log socket disconnect reason.
- Broadcast `stats:update` after socket register/disconnect.
- Accept public tunnel origins such as `*.devtunnels.ms`, `*.ngrok-free.app`, and `*.trycloudflare.com`.

### 2.3 Monitoring API

Update monitoring stats so the admin page can display:

- active sessions/devices,
- recent activity history,
- socket source/transport metadata,
- larger recent history limit.

Keep `GET /api/v1/admin/monitoring/stats` as the main endpoint.

## 3. Mobile Changes

### 3.1 Dependency

Install `socket.io-client` in `mobile`.

### 3.2 Public Socket URL

Create `mobile/src/services/socket.service.ts`:

- Use `getApiOrigin()` from `mobile/src/configs/api-url.config.ts`.
- Never derive socket URL from `localhost`, Expo host, or LAN IP when `EXPO_PUBLIC_API_URL` exists.
- Connect with:
  - `path: '/socket.io'`,
  - transports `['websocket', 'polling']`,
  - reconnection enabled.

### 3.3 Mobile Session Lifecycle

Update `mobile/src/app/(tabs)/index.tsx`:

- After REST session start succeeds, connect socket for that `sessionId`.
- Emit socket `device:heartbeat` every 25 seconds.
- Keep REST heartbeat every 30 seconds as fallback.
- On app background/inactive:
  - emit a final socket heartbeat/end signal,
  - disconnect socket,
  - call REST session end,
  - clear active session id.
- On app active again, start a new session.

Expected behavior:

- Clean app exit/background removes device almost immediately.
- Network loss/crash removes device within 45-60 seconds through stale cleanup.

## 4. Web Changes

### 4.1 Dedicated Monitoring Page

Add:

- `frontend/src/pages/admin/monitoring.page.tsx`
- `frontend/src/components/admin/monitoring/monitoring.index.tsx`

Route:

- `/admin/monitoring`

Menu:

- Add `Monitoring` to the admin sidebar.

### 4.2 Remove Monitoring From Dashboard

Keep dashboard focused on analytics/overview.

Move live activities, concurrent devices, and realtime socket subscriptions to the new monitoring page.

### 4.3 Web Socket URL

Update `frontend/src/services/admin/monitoring.service.ts`:

- Derive socket URL from `VITE_SOCKET_URL` or `VITE_API_URL`.
- Strip `/api/v1` and use that origin for Socket.IO.
- Do not fall back to `ws://localhost:3000` when a public API URL exists.

Local `.env` should include:

```env
VITE_API_URL=https://your-public-backend.example.com/api/v1
```

## 5. Testing

### 5.1 Automated Checks

Run:

```bash
cd backend && npm run build
cd backend && npm run test:monitoring
cd frontend && npm run build
cd mobile && npx tsc --noEmit
```

### 5.2 Manual Socket Checklist

- Mobile starts a session and appears in `/admin/monitoring`.
- Active device row shows device info, source, last activity, and transport.
- Admin receives `stats:update` when mobile starts.
- Admin receives `activity:new` when mobile plays audio.
- Mobile background/exit removes device in under 1 minute.
- Turning off mobile network removes device in under 1 minute.
- Browser console does not show:
  - `ws://localhost:3000/socket.io`
  - `WebSocket is closed before the connection is established`
- Backend logs show socket connect/register/disconnect events.

## 6. Success Criteria

- `/admin/monitoring` is available and detailed.
- Dashboard no longer owns live monitoring UI.
- Mobile socket connects through public API origin.
- Device inactive status updates within 1 minute.
- REST heartbeat still works as fallback.
- Build and monitoring tests pass.
