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

import { User } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    return this.generateToken(user);
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

    return this.generateToken(user);
  }

  private generateToken(user: User): TokenResponseDto {
    const accessSecret = this.configService.getOrThrow<string>('jwt.accessSecret');
    const accessExpiresIn = this.configService.getOrThrow<string>('jwt.accessExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );

    return {
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }
}
