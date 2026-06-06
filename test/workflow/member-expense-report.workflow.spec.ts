import { TestContext, authHeaders } from '../support/test-app';

describe('workflow: member expense to owner reporting', () => {
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

  it('supports member submission, owner visibility, report export, and audit logging', async () => {
    const fixtures = await ctx.reset();
    const memberLogin = await ctx.loginAs('member');
    const ownerLogin = await ctx.loginAs('owner');

    const createExpense = await ctx.api
      .post('/api/v1/expenses')
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id))
      .send({
        categoryId: fixtures.categories.travelCategory.id,
        title: 'Airport transfer',
        amount: 2200,
        currency: 'INR',
        expenseDate: '2026-06-06T00:00:00.000Z',
        paymentMethod: 'UPI',
        status: 'SUBMITTED',
      });

    expect(createExpense.status).toBe(201);

    const attachReceipt = await ctx.api
      .post(`/api/v1/expenses/${createExpense.body.data.id}/attachments`)
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id))
      .send({
        fileName: 'airport-transfer.pdf',
        fileType: 'application/pdf',
        fileSize: 4096,
      });

    expect(attachReceipt.status).toBe(201);
    expect(attachReceipt.body.data.uploadUrl).toContain('X-Amz-Signature');

    const ownerExpenseList = await ctx.api
      .get('/api/v1/expenses')
      .set(authHeaders(ownerLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(ownerExpenseList.status).toBe(200);
    expect(
      ownerExpenseList.body.data.data.some(
        (expense: { id: string }) => expense.id === createExpense.body.data.id,
      ),
    ).toBe(true);

    const exportReport = await ctx.api
      .post('/api/v1/reports/export')
      .set(authHeaders(ownerLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id))
      .send({
        reportType: 'EXPENSES_CSV',
        filters: { createdBy: memberLogin.user.id },
      });

    expect(exportReport.status).toBe(201);

    await waitFor(async () => {
      const report = await ctx.prisma.report.findUniqueOrThrow({
        where: { id: exportReport.body.data.id },
      });
      expect(report.status).toBe('COMPLETED');
    });

    const auditTrail = await ctx.api
      .get('/api/v1/audit-logs')
      .set(authHeaders(ownerLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(auditTrail.status).toBe(200);
    const actions = auditTrail.body.data.data.map((entry: { action: string }) => entry.action);
    expect(actions).toEqual(
      expect.arrayContaining(['expense.created', 'report.exported']),
    );
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
