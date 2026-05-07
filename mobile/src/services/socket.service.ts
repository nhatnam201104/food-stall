import { io, type Socket } from "socket.io-client";
import { getApiOrigin } from "../configs/api-url.config";
import type {
  DeviceEndPayload,
  DeviceHeartbeatPayload,
} from "../types/socket.types";

const HEARTBEAT_INTERVAL_MS = 25_000;

interface ConnectOptions {
  sessionId: string;
  deviceInfo?: string;
}

class MobileSocketService {
  private socket: Socket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private activeSessionId: string | null = null;
  private activeDeviceInfo: string | undefined;

  connect(options: ConnectOptions): void {
    if (this.socket?.connected && this.activeSessionId === options.sessionId) {
      this.sendHeartbeat();
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.activeSessionId = options.sessionId;
    this.activeDeviceInfo = options.deviceInfo;

    this.socket = io(getApiOrigin(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      this.sendHeartbeat();
    });

    this.socket.io.on("reconnect", () => {
      this.sendHeartbeat();
    });

    this.socket.on("connect_error", (error: Error) => {
      console.warn("[mobile-socket] connect_error", error.message);
    });

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  sendHeartbeat(): void {
    if (!this.activeSessionId || !this.socket?.connected) return;

    const payload: DeviceHeartbeatPayload = {
      sessionId: this.activeSessionId,
      deviceInfo: this.activeDeviceInfo,
    };

    this.socket.emit("device:heartbeat", payload);
  }

  endSession(sessionId = this.activeSessionId): void {
    if (!sessionId) return;

    const payload: DeviceEndPayload = { sessionId };
    this.socket?.emit("device:end", payload);
    this.disconnect();
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.socket?.disconnect();
    this.socket = null;
    this.activeSessionId = null;
    this.activeDeviceInfo = undefined;
  }
}

export const mobileSocketService = new MobileSocketService();
