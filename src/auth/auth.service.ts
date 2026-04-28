import * as crypto from 'crypto';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { RefreshToken } from '../database/entities/refresh-token.entity';
import { User } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const bcryptRounds = this.configService.getOrThrow<number>('jwt.bcryptRounds');
    const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.username,
    });
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, isActive: true },
    });

    const isValid =
      user !== null && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(rawToken: string): Promise<TokenResponseDto> {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.refreshTokenRepository.findOne({
      where: { token: tokenHash },
      relations: ['user'],
    });

    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.delete({ id: stored.id });

    return this.generateTokens(stored.user);
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepository.delete({ token: tokenHash });
  }

  private async generateTokens(user: User): Promise<TokenResponseDto> {
    const accessSecret = this.configService.getOrThrow<string>('jwt.accessSecret');
    const refreshSecret = this.configService.getOrThrow<string>('jwt.refreshSecret');
    const accessExpiresIn = this.configService.getOrThrow<string>('jwt.accessExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresIn = this.configService.getOrThrow<string>('jwt.refreshExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshTokenTtlDays = this.configService.getOrThrow<number>('jwt.refreshTokenTtlDays');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenTtlDays);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: tokenHash,
      userId: user.id,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: rawRefreshToken },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  extractRawRefreshToken(refreshToken: string): string {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    try {
      const payload = this.jwtService.verify<{ jti: string }>(refreshToken, {
        secret: refreshSecret,
      });
      return payload.jti;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
