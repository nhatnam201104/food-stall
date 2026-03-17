import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  roleId: string;
  roleName: string;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwt.secret);
  return decoded as JwtPayload;
};
