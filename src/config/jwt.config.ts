import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-change-me',
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
  bcryptRounds: 12,
  refreshTokenTtlDays: 7,
}));
