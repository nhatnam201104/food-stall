export type UserRole = 'admin' | 'merchant' | 'tourist';

export interface AuthSessionUser {
  id: string;
  fullName: string;
  email: string;
  role: Extract<UserRole, 'admin' | 'merchant'>;
  isActive: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface MerchantRegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  shopName: string;
  address?: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: AuthSessionUser;
  token?: string;
}
