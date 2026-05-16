# Plan: Anonymous Tourist Access & Real-time Monitoring System

## 1. Requirements Restatement

### Task 1: Remove Tourist Authentication on Mobile
- Allow anonymous (non-authenticated) users to access all tourist features
- Tourists can view POIs, view Tours, start sessions, and play audio without login
- Anonymous sessions identified by device info instead of userId
- Existing authenticated tourist flow must still work

### Task 2: Real-time Monitoring for Admin
- Track concurrent users (in-memory, no Redis)
- Display live concurrent user count on Admin Dashboard
- Enforce concurrent session limits (configurable cap)
- Log user activity (session start/end, audio plays)
- Real-time updates on admin dashboard via Socket.io
- Allow devices to connect through Expo tunnel (dev tunneling)

## 2. Simplification Decisions

| Original | Simplified | Reason |
|---|---|---|
| Redis Sorted Sets | In-memory Map | Single server, no distributed setup |
| Socket.io (WebSocket) | Socket.io with in-memory adapter | Real-time bidirectional, works with Expo tunnel (dev) |
| Separate activity DB table | Log to file + in-memory buffer | Reduce DB writes |

**Trade-off**: In-memory tracking resets on server restart. Acceptable for MVP. Redis can be added later for multi-instance.

## 3. Architecture Overview

```
[Visitor App]  →  [Express API]  →  [PostgreSQL]
                      ↓
              [In-Memory State]
              - activeSessions Map
              - activityBuffer Array
                      ↓
              [Socket.io Server]
                      ↓
              [Admin Dashboard]  ←  WebSocket connection
              [Other Devices]   ←  Expo tunnel (dev)

[Winston Logger]  →  logs/app.log (file)
```

**Expoltunnel support**: Socket.io configured with `path: '/socket.io'` and proper CORS for dev tunnel URLs (`*.expo.dev`, `*.ngrok.io`, `localhost`). In production, use reverse proxy (nginx) with WebSocket upgrade headers.

## 4. Implementation Phases

### Task 1: Anonymous Tourist Access

#### Phase 1.1: Backend — Optional Auth Middleware

**File**: `backend/src/middleware/auth.middleware.ts`

Add `optionalAuth` that continues as guest if token is missing or invalid:

```typescript
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      // Invalid token → continue as guest (no error thrown)
    }
  }
  next();
};
```

#### Phase 1.2: Backend — Remove Auth from Tourist Routes

**File**: `backend/src/routes/tourist/index.ts`

Change from:
```typescript
router.use(authenticate, authorize('tourist'));
```

To:
```typescript
router.use(optionalAuth); // Auth optional — continues as guest
router.use('/pois', touristPoiRoutes);
router.use('/tours', touristTourRoutes);
router.use('/sessions', touristSessionRoutes);
```

#### Phase 1.3: Backend — Support Anonymous Sessions

**File**: `backend/src/services/tourist/session.service.ts`

Make `userId` optional. If null, generate anonymous device-based session ID:

```typescript
async start(userId: string | null, payload: SessionStartPayload) {
  const sessionId = userId || `guest_${generateDeviceId(payload.deviceInfo)}`;

  return prisma.userSession.create({
    data: {
      userId: userId || null,
      sessionId,
      // ...
    },
  });
}
```

**File**: `backend/src/controllers/tourist/session.controller.ts`

Extract `userId` from `req.user?.userId` (may be undefined for guests). Pass `null` to service if not authenticated.

#### Phase 1.4: Frontend — Update Public Routes

**File**: `frontend/src/routes/route.public.tsx`

Add tourist routes as public (no auth required):
- `/pois` — POI listing and map
- `/tours` — Tour listing
- `/session/start` — auto-triggered on app open

---

### Task 2: Real-time Monitoring System

#### Phase 2.1: Backend — In-Memory Connection Tracking

**File**: `backend/src/services/monitoring/connection-tracker.service.ts` (NEW)

```typescript
interface ActiveConnection {
  sessionId: string;
  userId: string | null;
  deviceInfo: string;
  connectedAt: Date;
  lastActivity: Date;
}

// In-memory store
const activeConnections = new Map<string, ActiveConnection>();

// Cleanup interval (every 60s, remove stale connections > 5 min inactive)
const cleanupInterval = setInterval(cleanupStaleConnections, 60_000);

function cleanupStaleConnections() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [sessionId, conn] of activeConnections) {
    if (conn.lastActivity.getTime() < fiveMinutesAgo) {
      activeConnections.delete(sessionId);
    }
  }
}

export const connectionTracker = {
  track(sessionId: string, userId: string | null, deviceInfo: string): number {
    activeConnections.set(sessionId, {
      sessionId,
      userId,
      deviceInfo,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });
    return activeConnections.size;
  },

  untrack(sessionId: string): number {
    activeConnections.delete(sessionId);
    return activeConnections.size;
  },

  touch(sessionId: string): void {
    const conn = activeConnections.get(sessionId);
    if (conn) conn.lastActivity = new Date();
  },

  getConcurrentCount(): number {
    return activeConnections.size;
  },

  getRecentActivities(limit = 50) {
    return Array.from(activeConnections.values())
      .sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime())
      .slice(0, limit);
  },
};
```

#### Phase 2.2: Backend — Activity Logging Service

**File**: `backend/src/services/monitoring/activity-log.service.ts` (NEW)

```typescript
interface ActivityLogEntry {
  type: 'session_start' | 'session_end' | 'audio_play' | 'poi_view' | 'tour_start' | 'app_open';
  sessionId: string;
  userId: string | null;
  deviceInfo: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const LOG_BUFFER_SIZE = 500;
const activityLog: ActivityLogEntry[] = [];

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export const activityLogger = {
  log(entry: Omit<ActivityLogEntry, 'timestamp'>): void {
    activityLog.push({ ...entry, timestamp: new Date() });
    if (activityLog.length > LOG_BUFFER_SIZE) {
      activityLog.shift();
    }
    logger.info({ type: 'activity', ...entry });
  },

  getRecent(limit = 50): ActivityLogEntry[] {
    return activityLog.slice(-limit);
  },

  getStats(): MonitoringStats {
    const now = Date.now();
    const oneHourAgo = now - 3600_000;

    return {
      concurrentUsers: connectionTracker.getConcurrentCount(),
      sessionsLastHour: activityLog.filter(
        e => e.type === 'session_start' && e.timestamp.getTime() > oneHourAgo
      ).length,
      totalListensToday: activityLog.filter(
        e => e.type === 'audio_play' && isToday(e.timestamp)
      ).length,
      recentActivities: activityLog.slice(-20),
    };
  },
};
```

#### Phase 2.3: Backend — Socket.io Server Setup

**File**: `backend/src/config/socket.ts` (NEW)

```typescript
import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server;

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: '*', // Allow Expo tunnel, localhost, ngrok in dev
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // polling fallback for Expo
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Admin joins dashboard room
    socket.on('admin:join', () => {
      socket.join('admin:dashboard');
      console.log(`[Socket] Admin joined dashboard room`);
    });

    // Tourist device heartbeat
    socket.on('device:heartbeat', (data: { sessionId: string; userId?: string }) => {
      connectionTracker.touch(data.sessionId);
      socket.data.sessionId = data.sessionId;
      socket.data.userId = data.userId;
    });

    socket.on('disconnect', () => {
      if (socket.data.sessionId) {
        connectionTracker.untrack(socket.data.sessionId);
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => io;

// Broadcast to all admins
export const broadcastToAdmins = (event: string, data: any): void => {
  io.to('admin:dashboard').emit(event, data);
};
```

**File**: `backend/src/server.ts`

Replace `app.listen()` with HTTP server + Socket.io:
```typescript
import { createServer } from 'http';
import { initSocketServer } from './config/socket';

const httpServer = createServer(app);
initSocketServer(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Phase 2.3b: Backend — REST Stats Endpoint

**File**: `backend/src/routes/admin/monitoring.routes.ts` (NEW)

```typescript
// GET /api/admin/monitoring/stats — REST fallback

export const getMonitoringStats = async (req: Request, res: Response) => {
  res.json({ success: true, data: activityLogger.getStats() });
};
```

#### Phase 2.4: Backend — Hook Tracking into Existing Flows

**File**: `backend/src/services/tourist/session.service.ts`

After `session.create`:
```typescript
connectionTracker.track(session.id, userId, payload.deviceInfo);
activityLogger.log({ type: 'session_start', sessionId: session.id, userId, deviceInfo: payload.deviceInfo, metadata: {} });
broadcastToAdmins('stats:update', activityLogger.getStats());
```

After session end:
```typescript
connectionTracker.untrack(sessionId);
activityLogger.log({ type: 'session_end', sessionId, userId, deviceInfo: '', metadata: {} });
broadcastToAdmins('stats:update', activityLogger.getStats());
```

**File**: `backend/src/controllers/tourist/poi.controller.ts` or wherever audio plays are triggered

After audio play starts:
```typescript
activityLogger.log({ type: 'audio_play', sessionId, userId, deviceInfo, metadata: { poiId, poiName } });
broadcastToAdmins('stats:update', activityLogger.getStats());
broadcastToAdmins('activity:new', { type: 'audio_play', sessionId, userId, poiId, poiName, timestamp: new Date() });
```

#### Phase 2.5: Backend — Logging Infrastructure

**File**: `backend/src/config/logger.ts` (NEW)

```typescript
import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'app.log'), maxsize: 5_000_000, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5_000_000, maxFiles: 5 }),
  ],
});
```

Add to `backend/.gitignore`: `logs/`

#### Phase 2.6: Backend — Concurrent Session Limit

**File**: `backend/src/middleware/concurrent-limit.middleware.ts` (NEW)

```typescript
const MAX_CONCURRENT_SESSIONS = parseInt(process.env.MAX_CONCURRENT_SESSIONS || '500', 10);

export const concurrentLimit = (req: Request, res: Response, next: NextFunction): void => {
  if (connectionTracker.getConcurrentCount() >= MAX_CONCURRENT_SESSIONS) {
    return res.status(503).json({
      success: false,
      message: 'Server at full capacity. Please try again later.',
    });
  }
  next();
};
```

Apply to tourist routes in `backend/src/routes/tourist/index.ts`:
```typescript
router.use(concurrentLimit);
```

#### Phase 2.7: Frontend — Admin Dashboard Real-time

**File**: `frontend/src/services/admin/monitoring.service.ts` (NEW)

```typescript
import { io, Socket } from 'socket.io-client';

class MonitoringService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(serverUrl?: string): void {
    // In dev with Expo tunnel, serverUrl points to tunnel address
    this.socket = io(serverUrl || window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      // Identify as admin
      this.socket?.emit('admin:join');
    });

    this.socket.on('stats:update', (data) => {
      this.listeners.get('update')?.forEach(cb => cb(data));
    });

    this.socket.on('activity:new', (data) => {
      this.listeners.get('activity')?.forEach(cb => cb(data));
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }

  // Device heartbeat (called from Visitor App)
  sendHeartbeat(sessionId: string, userId?: string): void {
    this.socket?.emit('device:heartbeat', { sessionId, userId });
  }

  onUpdate(callback: (stats: MonitoringStats) => void): void {
    if (!this.listeners.has('update')) this.listeners.set('update', new Set());
    this.listeners.get('update')!.add(callback);
  }

  onActivity(callback: (activity: ActivityEntry) => void): void {
    if (!this.listeners.has('activity')) this.listeners.set('activity', new Set());
    this.listeners.get('activity')!.add(callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const monitoringService = new MonitoringService();
```

**File**: `frontend/src/components/admin/dashboard/dashboard.index.tsx`

```typescript
useEffect(() => {
  // Connect to Socket.io (URL from env in dev, production uses same origin)
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  monitoringService.connect(socketUrl);

  monitoringService.onUpdate((stats) => {
    setOverview(prev => ({
      ...prev,
      concurrentUsers: stats.concurrentUsers,
      sessionsLastHour: stats.sessionsLastHour,
      totalListensToday: stats.totalListensToday,
    }));
    setRecentActivities(stats.recentActivities);
  });

  monitoringService.onActivity((activity) => {
    setRecentActivities(prev => [activity, ...prev.slice(0, 49)]);
  });

  return () => monitoringService.disconnect();
}, []);
```

Add concurrent users card to dashboard JSX.

---

## 5. File Changes Summary

### Backend — New Files

| File | Purpose |
|---|---|
| `backend/src/services/monitoring/connection-tracker.service.ts` | In-memory concurrent user tracking |
| `backend/src/services/monitoring/activity-log.service.ts` | Activity logging with circular buffer |
| `backend/src/config/socket.ts` | Socket.io server setup |
| `backend/src/routes/admin/monitoring.routes.ts` | REST stats endpoint |
| `backend/src/middleware/concurrent-limit.middleware.ts` | Concurrent session enforcement |
| `backend/src/config/logger.ts` | Winston configuration |

### Backend — Modified Files

| File | Change |
|---|---|
| `backend/src/middleware/auth.middleware.ts` | Add `optionalAuth` |
| `backend/src/routes/tourist/index.ts` | Replace auth with `optionalAuth`, add `concurrentLimit` |
| `backend/src/services/tourist/session.service.ts` | Support null userId, hook tracking, broadcastToAdmins |
| `backend/src/controllers/tourist/session.controller.ts` | Pass null userId for anonymous |
| `backend/src/server.ts` | Replace `app.listen` with HTTP server + Socket.io init |
| `backend/src/app.ts` | Register monitoring routes |
| `backend/src/routes/index.ts` | Add monitoring routes |
| `backend/.gitignore` | Ignore `logs/` |
| `backend/.env.example` | Add `MAX_CONCURRENT_SESSIONS=500` |

### Frontend — New Files

| File | Purpose |
|---|---|
| `frontend/src/services/admin/monitoring.service.ts` | SSE client + polling fallback |

### Frontend — Modified Files

| File | Change |
|---|---|
| `frontend/src/components/admin/dashboard/dashboard.index.tsx` | Connect SSE, display live stats |

---

## 6. Database Schema

No schema changes required. Monitoring uses:
- In-memory Maps for active connections
- In-memory circular buffer (500 entries) for recent activity
- Winston file logs for persistent activity history

---

## 7. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MAX_CONCURRENT_SESSIONS` | `500` | Max concurrent tourist sessions |

---

## 8. Dependencies

**Backend npm packages:**
```bash
npm install socket.io @socket.io/redis-adapter  # @socket.io/redis-adapter for multi-instance later
npm install -D @types/socket.io
```

**Frontend npm packages:**
```bash
npm install socket.io-client
```

Backend already has `winston`. In-memory adapter is used (no Redis). For Expo tunnel support, Socket.io is configured with `transports: ['websocket', 'polling']` — polling fallback ensures connectivity through HTTP tunnels.

---

## 9. Implementation Order

**Task 1** (4-6 hours):
1. `optionalAuth` middleware
2. Remove auth from tourist routes
3. Support anonymous sessions
4. Frontend public routes

**Task 2** (6-8 hours):
1. `connection-tracker.service.ts`
2. `activity-log.service.ts`
3. `socket.ts` config + integrate into `server.ts`
4. `monitoring.routes.ts` (REST stats)
5. Hook tracking into session/audio flows + `broadcastToAdmins`
6. `logger.ts`
7. `concurrent-limit.middleware.ts`
8. Frontend `monitoring.service.ts` (Socket.io client) + dashboard update

---

## 10. Success Criteria

### Task 1
- [ ] Tourist can use app without login
- [ ] POI listing/map works without auth
- [ ] Audio plays without auth
- [ ] Authenticated tourist still works

### Task 2
- [ ] Admin sees live concurrent user count via Socket.io
- [ ] Admin sees real-time activity feed
- [ ] New connections increment count live
- [ ] Disconnections decrement count after 5-min timeout
- [ ] `MAX_CONCURRENT_SESSIONS` limit enforced (503 response)
- [ ] Activity log written to `logs/app.log`
- [ ] Socket.io connects through Expo tunnel (dev)
- [ ] Socket.io fallback to polling if WebSocket fails