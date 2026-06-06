import { TestContext, authHeaders } from '../support/test-app';

describe('integration: reports, analytics, audit, and admin', () => {
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

  it('restricts analytics and report exports to owner/admin roles', async () => {
    const fixtures = await ctx.reset();
    const memberLogin = await ctx.loginAs('member');
    const ownerLogin = await ctx.loginAs('owner');

    const memberAnalytics = await ctx.api
      .get('/api/v1/analytics/overview')
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(memberAnalytics.status).toBe(403);
    expect(memberAnalytics.body.error.message).toBe('Insufficient permissions');

    const ownerAnalytics = await ctx.api
      .get('/api/v1/analytics/overview')
      .set(authHeaders(ownerLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(ownerAnalytics.status).toBe(200);
    expect(ownerAnalytics.body.data.totalExpenses).toBeGreaterThan(0);

    const memberReport = await ctx.api
      .post('/api/v1/reports/export')
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id))
      .send({
        reportType: 'EXPENSES_CSV',
        filters: {},
      });

    expect(memberReport.status).toBe(403);
  });

  it('creates queued reports, marks jobs complete, and scopes audit logs by organization', async () => {
    const fixtures = await ctx.reset();
    const adminLogin = await ctx.loginAs('admin');

    const createReport = await ctx.api
      .post('/api/v1/reports/export')
      .set(authHeaders(adminLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id))
      .send({
        reportType: 'EXPENSES_CSV',
        filters: { status: 'APPROVED' },
      });

    expect(createReport.status).toBe(201);

    await waitFor(async () => {
      const report = await ctx.prisma.report.findUniqueOrThrow({
        where: { id: createReport.body.data.id },
      });

      expect(report.status).toBe('COMPLETED');
      expect(report.fileKey).toContain('/reports/');
    });

    const completedJobs = await ctx.prisma.backgroundJob.findMany({
      where: { organizationId: fixtures.organizations.primaryOrg.id },
    });

    expect(completedJobs.some((job) => job.status === 'COMPLETED')).toBe(true);

    const auditLogs = await ctx.api
      .get('/api/v1/audit-logs')
      .set(authHeaders(adminLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(auditLogs.status).toBe(200);
    expect(
      auditLogs.body.data.data.some((entry: { action: string }) => entry.action === 'report.exported'),
    ).toBe(true);

    const crossTenantReport = await ctx.prisma.report.findFirstOrThrow({
      where: { organizationId: fixtures.organizations.secondaryOrg.id },
    });
    const foreignFetch = await ctx.api
      .get(`/api/v1/reports/${crossTenantReport.id}`)
      .set(authHeaders(adminLogin.tokens.accessToken, fixtures.organizations.secondaryOrg.id));

    expect(foreignFetch.status).toBe(403);
    expect(foreignFetch.body.error.message).toBe('Organization access denied');
  });

  it('keeps admin routes restricted to super admins and exposes readiness checks', async () => {
    const fixtures = await ctx.reset();
    const ownerLogin = await ctx.loginAs('owner');
    const superAdminLogin = await ctx.loginAs('superAdmin');

    const ownerAdminRoute = await ctx.api
      .get('/api/v1/admin/users')
      .set(authHeaders(ownerLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(ownerAdminRoute.status).toBe(403);

    const superAdminRoute = await ctx.api
      .get('/api/v1/admin/users')
      .set(authHeaders(superAdminLogin.tokens.accessToken));

    expect(superAdminRoute.status).toBe(200);
    expect(Array.isArray(superAdminRoute.body.data)).toBe(true);

    const readiness = await ctx.api.get('/api/v1/health/ready');

    expect(readiness.status).toBe(200);
    expect(readiness.body.data.status).toBe('ready');
    expect(readiness.body.data.checks.database).toBe(true);
    expect(readiness.body.data.checks.redis).toBe(true);
  });
});

async function waitFor(assertion: () => Promise<void>, timeoutMs = 10000, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw lastError;
}
