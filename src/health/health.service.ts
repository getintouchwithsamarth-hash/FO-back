import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.redis = new Redis(configService.getOrThrow<string>('redis.url'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const db = await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.connect();
    const redis = await this.redis.ping();
    await this.redis.quit();

    return {
      status: 'ready',
      checks: {
        database: !!db,
        redis: redis === 'PONG',
      },
    };
  }
}
