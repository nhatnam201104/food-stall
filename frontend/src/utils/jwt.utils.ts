/**
 * JWT utility functions for frontend
 * Lưu ý: Chỉ decode payload, không verify signature (chỉ dùng để check expiry)
 */

/**
 * Decode JWT token payload (base64) - không verify signature
 * Chỉ dùng cho việc kiểm tra expiry phía client
 */
export const decodeTokenPayload = <T = Record<string, unknown>>(token: string): T | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    // JWT dùng base64url encoding, cần replace _ thành / và - thành +
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};

/**
 * Kiểm tra token đã expire chưa
 * @param token - JWT token string
 * @returns true nếu token đã expire hoặc invalid
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeTokenPayload<{ exp: number }>(token);
    if (!payload?.exp) return true;
    
    const expMs = payload.exp * 1000; // Convert from seconds to milliseconds
    return Date.now() >= expMs;
  } catch {
    return true; // Invalid token → coi như expired
  }
};

/**
 * Lấy thời gian hết hạn của token (timestamp ms)
 * @param token - JWT token string
 * @returns timestamp ms hoặc null nếu invalid
 */
export const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = decodeTokenPayload<{ exp: number }>(token);
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};
