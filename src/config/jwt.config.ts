import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me',
  accessExpiresIn: '15m',
  bcryptRounds: 12,
}));
