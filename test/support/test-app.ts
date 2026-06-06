import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import request from 'supertest';

import { createConfiguredApp } from '@/bootstrap';

import {
  TEST_PASSWORD,
  resetDatabase,
  seedTestDatabase,
  testIds,
} from './fixtures';

export class TestContext {
  app!: INestApplication;
  prisma!: PrismaClient;
  redis!: Redis;
  api!: ReturnType<typeof request>;

  async init() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 1,
    });

    this.app = await createConfiguredApp();
    await this.app.init();
    await this.app.getHttpAdapter().getInstance().ready();
    this.api = request(this.app.getHttpServer());
  }

  async reset() {
    await this.redis.flushdb();
    await resetDatabase(this.prisma);
    return seedTestDatabase(this.prisma);
  }

  async close() {
    await this.app?.close();
    await this.redis?.quit();
    await this.prisma?.$disconnect();
  }

  async loginAs(role: 'owner' | 'admin' | 'member' | 'outsider' | 'superAdmin') {
    const emailMap = {
      owner: testIds.ownerEmail,
      admin: testIds.adminEmail,
      member: testIds.memberEmail,
      outsider: testIds.outsiderEmail,
      superAdmin: testIds.superAdminEmail,
    };

    const response = await this.api.post('/api/v1/auth/login').send({
      email: emailMap[role],
      password: TEST_PASSWORD,
    });

    return response.body.data as {
      user: { id: string; email: string };
      tokens: { accessToken: string; refreshToken: string };
    };
  }
}

export function authHeaders(token: string, organizationId?: string) {
  return {
    Authorization: `Bearer ${token}`,
    ...(organizationId ? { 'x-organization-id': organizationId } : {}),
  };
}
