import type { AuthResult, AuthSessionUser, LoginPayload, MerchantRegisterPayload, User } from '../types';
import { mockMerchants, mockUsers } from './index';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const toAuthUser = (user: User): AuthSessionUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.roleId === 'role-admin' ? 'admin' : 'merchant',
  isActive: user.isActive,
});

const validateLogin = (payload: LoginPayload): AuthResult => {
  const user = mockUsers.find((item) => item.email === payload.email && item.passwordHash === payload.password);

  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (!user.isActive) {
    return { success: false, message: 'Account is inactive. Please contact system admin.' };
  }

  return {
    success: true,
    message: 'Login successful.',
    user: toAuthUser(user),
    token: `mock-token-${user.id}-${Date.now()}`,
  };
};

// MOCK service only. Replace these methods with real API integration later.
export const mockAuthService = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    await sleep(700);
    return validateLogin(payload);
  },

  async registerMerchant(payload: MerchantRegisterPayload): Promise<AuthResult> {
    await sleep(900);

    const duplicated = mockUsers.some((item) => item.email.toLowerCase() === payload.email.toLowerCase());

    if (duplicated) {
      return { success: false, message: 'Email already exists.' };
    }

    const userId = `usr-merchant-${mockUsers.length + 1}`;
    const merchantId = `mer-${mockMerchants.length + 1}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      roleId: 'role-merchant',
      fullName: payload.fullName,
      email: payload.email,
      passwordHash: payload.password,
      phone: payload.phone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    mockUsers.push(newUser);
    mockMerchants.push({
      id: merchantId,
      userId,
      shopName: payload.shopName,
      address: payload.address,
      contactEmail: payload.email,
      status: 'pending',
      createdAt: now,
    });

    return { success: true, message: 'Merchant registered successfully. Please login.' };
  },
};
