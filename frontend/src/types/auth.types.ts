export type UserRole = 'admin' | 'merchant' | 'tourist';

export interface AuthSessionUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: Extract<UserRole, 'admin' | 'merchant'>;
  isActive: boolean;
  merchant?: {
    id: string;
    shopName: string;
    address?: string | null;
    contactEmail?: string | null;
  } | null;
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
  avatarUrl?: string | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
  shopName?: string;
  address?: string;
  contactEmail?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: AuthSessionUser;
  token?: string;
}
