import { ExpenseStatus } from '@prisma/client';

import { TestContext, authHeaders } from '../support/test-app';

describe('integration: expenses and attachments', () => {
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

  it('limits members to their own expenses while admins can see all workspace expenses', async () => {
    const fixtures = await ctx.reset();
    const memberLogin = await ctx.loginAs('member');
    const adminLogin = await ctx.loginAs('admin');

    const memberList = await ctx.api
      .get('/api/v1/expenses')
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(memberList.status).toBe(200);
    expect(memberList.body.data.data).toHaveLength(1);
    expect(memberList.body.data.data[0].id).toBe(fixtures.expenses.memberExpense.id);

    const memberForbidden = await ctx.api
      .get(`/api/v1/expenses/${fixtures.expenses.ownerExpense.id}`)
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(memberForbidden.status).toBe(403);
    expect(memberForbidden.body.error.message).toBe('You cannot view this expense');

    const adminList = await ctx.api
      .get('/api/v1/expenses')
      .set(authHeaders(adminLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(adminList.status).toBe(200);
    expect(adminList.body.data.data).toHaveLength(2);
  });

  it('allows a member to create an expense with category and currency capture', async () => {
    const fixtures = await ctx.reset();
    const memberLogin = await ctx.loginAs('member');

    const response = await ctx.api
      .post('/api/v1/expenses')
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id))
      .send({
        categoryId: fixtures.categories.softwareCategory.id,
        title: 'New Laptop Charger',
        amount: 45,
        currency: 'USD',
        expenseDate: '2026-06-06T00:00:00.000Z',
        paymentMethod: 'CARD',
        status: ExpenseStatus.SUBMITTED,
        tagNames: ['hardware'],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.currency).toBe('USD');
    expect(response.body.data.baseCurrency).toBe('INR');
    expect(response.body.data.status).toBe(ExpenseStatus.SUBMITTED);
    expect(response.body.data.categoryId).toBe(fixtures.categories.softwareCategory.id);
  });

  it('restricts attachment access to the uploader for members and preserves tenant scoping', async () => {
    const fixtures = await ctx.reset();
    const memberLogin = await ctx.loginAs('member');
    const ownerLogin = await ctx.loginAs('owner');
    const memberAttachment = await ctx.prisma.attachment.findFirstOrThrow({
      where: { organizationId: fixtures.organizations.primaryOrg.id },
    });
    const outsiderAttachment = await ctx.prisma.attachment.findFirstOrThrow({
      where: { organizationId: fixtures.organizations.secondaryOrg.id },
    });

    const memberOwn = await ctx.api
      .get(`/api/v1/attachments/${memberAttachment.id}`)
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(memberOwn.status).toBe(200);
    expect(memberOwn.body.data.downloadUrl).toContain('X-Amz-Signature');

    const memberCrossOrg = await ctx.api
      .get(`/api/v1/attachments/${outsiderAttachment.id}`)
      .set(authHeaders(memberLogin.tokens.accessToken, fixtures.organizations.secondaryOrg.id));

    expect(memberCrossOrg.status).toBe(403);
    expect(memberCrossOrg.body.error.message).toBe('Organization access denied');

    const ownerAccess = await ctx.api
      .get(`/api/v1/attachments/${memberAttachment.id}`)
      .set(authHeaders(ownerLogin.tokens.accessToken, fixtures.organizations.primaryOrg.id));

    expect(ownerAccess.status).toBe(200);
  });
});
