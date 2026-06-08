import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersRepository } from '@/users/repositories/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: { sub: string; username: string }) {
    const user = await this.usersRepository.findActiveById(payload.sub);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      platformRole: user.platformRole,
      preferredCurrency: user.preferredCurrency,
      dateFormat: user.dateFormat,
      numberFormat: user.numberFormat,
    };
  }
}
