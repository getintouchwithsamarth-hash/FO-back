import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';


import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersRepository } from './repositories/users.repository';

import type { RequestUser } from '@/common/types/authenticated-request';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getMe(user: RequestUser) {
    return this.usersRepository.findActiveById(user.id);
  }

  updateMe(userId: string, dto: UpdateProfileDto) {
    return this.usersRepository.updateProfile(userId, dto);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.usersRepository.findByIdWithSecrets(userId);
    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    return this.usersRepository.updatePassword(userId, await bcrypt.hash(dto.newPassword, 10));
  }
}
