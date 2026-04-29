import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../database/entities/user.entity';
import { PublicUserProfileDto, UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getOwnProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.findActiveUser(userId);
    return this.toProfileDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.findActiveUser(userId);

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.userRepository.save(user);
    return this.toProfileDto(user);
  }

  async getPublicProfile(userId: string): Promise<PublicUserProfileDto> {
    const user = await this.findActiveUser(userId);
    const { email: _, ...publicProfile } = this.toProfileDto(user);
    return publicProfile;
  }

  async updateAvatar(userId: string, filename: string): Promise<UserProfileDto> {
    const user = await this.findActiveUser(userId);
    user.avatarUrl = '/uploads/' + filename;
    await this.userRepository.save(user);
    return this.toProfileDto(user);
  }

  async softDelete(userId: string): Promise<void> {
    const user = await this.findActiveUser(userId);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  private async findActiveUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      reputationScore: user.reputationScore,
      createdAt: user.createdAt,
    };
  }
}
