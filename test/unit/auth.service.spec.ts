import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuthService } from '@/auth/auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const bcryptMock = jest.mocked(bcrypt);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('logs in superadmin users even if login bookkeeping writes fail', async () => {
    const user = {
      id: 'user-superadmin',
      username: 'superadmin',
      email: 'superadmin@finance.local',
      fullName: 'Platform Super Admin',
      passwordHash: 'stored-hash',
      refreshTokenHash: null,
      status: UserStatus.ACTIVE,
      platformRole: 'SUPER_ADMIN',
      deletedAt: null,
    };

    const usersRepository = {
      findByUsername: jest.fn().mockResolvedValue(user),
      updateLastLogin: jest.fn().mockRejectedValue(new Error('db write failed')),
      updateRefreshToken: jest.fn().mockRejectedValue(new Error('db write failed')),
    };
    const organizationsRepository = {
      findMembershipsByUserId: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
    };
    const configService = {
      getOrThrow: jest
        .fn()
        .mockImplementation((key: string) => {
          const values: Record<string, string> = {
            'jwt.accessSecret': 'access-secret',
            'jwt.accessTtl': '15m',
            'jwt.refreshSecret': 'refresh-secret',
            'jwt.refreshTtl': '7d',
          };

          return values[key];
        }),
    };
    const auditLogsService = {
      log: jest.fn().mockRejectedValue(new Error('audit log failed')),
    };

    bcryptMock.compare.mockResolvedValue(true as never);
    bcryptMock.hash.mockResolvedValue('refresh-token-hash' as never);

    const service = new AuthService(
      usersRepository as never,
      organizationsRepository as never,
      jwtService as never,
      configService as never,
      auditLogsService as never,
    );

    await expect(
      service.login(
        {
          username: 'superadmin',
          password: 'DemoPass123!',
        },
        { ip: '127.0.0.1', userAgent: 'jest' },
      ),
    ).resolves.toEqual({
      user: {
        id: 'user-superadmin',
        username: 'superadmin',
        email: 'superadmin@finance.local',
        fullName: 'Platform Super Admin',
        status: UserStatus.ACTIVE,
        platformRole: 'SUPER_ADMIN',
        deletedAt: null,
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    expect(usersRepository.findByUsername).toHaveBeenCalledWith('superadmin');
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(auditLogsService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'login.success',
        entityId: 'user-superadmin',
      }),
    );
  });
});
