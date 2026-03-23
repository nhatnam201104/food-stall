export type UserRole = 'tourist' | 'merchant' | 'admin';

export interface TouristSessionUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: 'tourist';
  isActive: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TouristRegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
    isActive: boolean;
  };
}

export interface StoredAuthSession {
  token: string;
  user: TouristSessionUser;
}
