import { TestContext, authHeaders } from '../support/test-app';

describe('integration: auth and access', () => {
  const ctx = new TestContext();

  beforeAll(async () => {
    await ctx.init();
  });

  beforeEach(async () => {
    await ctx.reset();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('allows login, refresh token rotation, and profile lookup', async () => {
    const login = await ctx.loginAs('owner');
    const memberships = await ctx.prisma.organizationMember.findMany({
      where: { userId: login.user.id },
    });

    const meResponse = await ctx.api
      .get('/api/v1/auth/me')
      .set(authHeaders(login.tokens.accessToken));

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe(login.user.email);
    expect(meResponse.body.data.memberships).toHaveLength(memberships.length);

    const refreshResponse = await ctx.api.post('/api/v1/auth/refresh-token').send({
      refreshToken: login.tokens.refreshToken,
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.data.tokens.refreshToken).not.toBe(login.tokens.refreshToken);
  });

  it('rejects invalid refresh tokens with a stable error envelope', async () => {
    const response = await ctx.api.post('/api/v1/auth/refresh-token').send({
      refreshToken: 'invalid-token',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBeDefined();
  });

  it('blocks cross-tenant expense access and requires organization context', async () => {
    const fixtures = await ctx.reset();
    const memberLogin = await ctx.loginAs('member');

    const missingOrg = await ctx.api
      .get('/api/v1/expenses')
      .set(authHeaders(memberLogin.tokens.accessToken));

    expect(missingOrg.status).toBe(403);
    expect(missingOrg.body.error.message).toBe('Organization context is required');

    const crossTenant = await ctx.api
      .get(`/api/v1/expenses/${fixtures.expenses.outsiderExpense.id}`)
      .set(
        authHeaders(
          memberLogin.tokens.accessToken,
          fixtures.organizations.secondaryOrg.id,
        ),
      );

    expect(crossTenant.status).toBe(403);
    expect(crossTenant.body.error.message).toBe('Organization access denied');
  });
});
