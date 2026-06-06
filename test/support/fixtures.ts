import {
  ExpenseStatus,
  MembershipRole,
  PaymentMethod,
  PlatformRole,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const TEST_PASSWORD = 'TestPass123!';

export const testIds = {
  ownerEmail: 'owner@test.finance.local',
  adminEmail: 'admin@test.finance.local',
  memberEmail: 'member@test.finance.local',
  outsiderEmail: 'outsider@test.finance.local',
  superAdminEmail: 'superadmin@test.finance.local',
  primaryOrgSlug: 'alpha-workspace',
  secondaryOrgSlug: 'beta-workspace',
};

const truncateSql = `
  TRUNCATE TABLE
    "ExpenseTagLink",
    "Attachment",
    "Expense",
    "ExpenseTag",
    "ExpenseCategory",
    "Report",
    "AuditLog",
    "BackgroundJob",
    "FeatureFlag",
    "PasswordResetToken",
    "AdminEvent",
    "OrganizationMember",
    "CurrencyRate",
    "Organization",
    "User"
  RESTART IDENTITY CASCADE
`;

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(truncateSql);
}

export async function seedTestDatabase(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const today = new Date('2026-06-06T00:00:00.000Z');

  await prisma.featureFlag.create({
    data: {
      key: 'reports.export.enabled',
      enabled: true,
      description: 'Controls report export availability',
    },
  });

  const [owner, admin, member, outsider, superAdmin] = await Promise.all([
    prisma.user.create({
      data: {
        email: testIds.ownerEmail,
        passwordHash,
        fullName: 'Owner User',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: testIds.adminEmail,
        passwordHash,
        fullName: 'Admin User',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: testIds.memberEmail,
        passwordHash,
        fullName: 'Member User',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: testIds.outsiderEmail,
        passwordHash,
        fullName: 'Outsider User',
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: testIds.superAdminEmail,
        passwordHash,
        fullName: 'Super Admin User',
        status: UserStatus.ACTIVE,
        platformRole: PlatformRole.SUPER_ADMIN,
      },
    }),
  ]);

  const [primaryOrg, secondaryOrg] = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Alpha Workspace',
        slug: testIds.primaryOrgSlug,
        defaultCurrency: 'INR',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Beta Workspace',
        slug: testIds.secondaryOrgSlug,
        defaultCurrency: 'USD',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    }),
  ]);

  await prisma.organizationMember.createMany({
    data: [
      {
        organizationId: primaryOrg.id,
        userId: owner.id,
        role: MembershipRole.OWNER,
        status: 'ACTIVE',
        joinedAt: today,
      },
      {
        organizationId: primaryOrg.id,
        userId: admin.id,
        role: MembershipRole.ADMIN,
        status: 'ACTIVE',
        joinedAt: today,
      },
      {
        organizationId: primaryOrg.id,
        userId: member.id,
        role: MembershipRole.MEMBER,
        status: 'ACTIVE',
        joinedAt: today,
      },
      {
        organizationId: secondaryOrg.id,
        userId: outsider.id,
        role: MembershipRole.OWNER,
        status: 'ACTIVE',
        joinedAt: today,
      },
    ],
  });

  const [softwareCategory, travelCategory, betaCategory] = await Promise.all([
    prisma.expenseCategory.create({
      data: {
        organizationId: primaryOrg.id,
        name: 'Software',
        isDefault: true,
      },
    }),
    prisma.expenseCategory.create({
      data: {
        organizationId: primaryOrg.id,
        name: 'Travel',
        isDefault: true,
      },
    }),
    prisma.expenseCategory.create({
      data: {
        organizationId: secondaryOrg.id,
        name: 'Operations',
        isDefault: true,
      },
    }),
  ]);

  const [usdToInr, inrToUsd] = await Promise.all([
    prisma.currencyRate.create({
      data: {
        baseCurrency: 'USD',
        targetCurrency: 'INR',
        rate: new Prisma.Decimal(83.42),
        provider: 'seed',
        rateDate: today,
      },
    }),
    prisma.currencyRate.create({
      data: {
        baseCurrency: 'INR',
        targetCurrency: 'USD',
        rate: new Prisma.Decimal(0.01199),
        provider: 'seed',
        rateDate: today,
      },
    }),
  ]);

  const [ownerExpense, memberExpense, outsiderExpense] = await Promise.all([
    prisma.expense.create({
      data: {
        organizationId: primaryOrg.id,
        createdByUserId: owner.id,
        categoryId: softwareCategory.id,
        currencyRateId: usdToInr.id,
        title: 'Owner SaaS Expense',
        amount: new Prisma.Decimal(120),
        currency: 'USD',
        convertedAmount: new Prisma.Decimal(120 * 83.42),
        baseCurrency: 'INR',
        exchangeRate: new Prisma.Decimal(83.42),
        expenseDate: today,
        paymentMethod: PaymentMethod.CARD,
        status: ExpenseStatus.APPROVED,
      },
    }),
    prisma.expense.create({
      data: {
        organizationId: primaryOrg.id,
        createdByUserId: member.id,
        categoryId: travelCategory.id,
        title: 'Member Taxi Expense',
        amount: new Prisma.Decimal(1800),
        currency: 'INR',
        convertedAmount: new Prisma.Decimal(1800),
        baseCurrency: 'INR',
        exchangeRate: new Prisma.Decimal(1),
        expenseDate: today,
        paymentMethod: PaymentMethod.UPI,
        status: ExpenseStatus.DRAFT,
      },
    }),
    prisma.expense.create({
      data: {
        organizationId: secondaryOrg.id,
        createdByUserId: outsider.id,
        categoryId: betaCategory.id,
        currencyRateId: inrToUsd.id,
        title: 'Outsider Ops Expense',
        amount: new Prisma.Decimal(500),
        currency: 'USD',
        convertedAmount: new Prisma.Decimal(500),
        baseCurrency: 'USD',
        exchangeRate: new Prisma.Decimal(1),
        expenseDate: today,
        paymentMethod: PaymentMethod.CASH,
        status: ExpenseStatus.APPROVED,
      },
    }),
  ]);

  await prisma.attachment.createMany({
    data: [
      {
        organizationId: primaryOrg.id,
        uploadedByUserId: member.id,
        entityType: 'EXPENSE',
        entityId: memberExpense.id,
        fileName: 'member-receipt.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        storageKey: `${primaryOrg.id}/member-receipt.pdf`,
      },
      {
        organizationId: secondaryOrg.id,
        uploadedByUserId: outsider.id,
        entityType: 'EXPENSE',
        entityId: outsiderExpense.id,
        fileName: 'outsider-receipt.pdf',
        fileType: 'application/pdf',
        fileSize: 2048,
        storageKey: `${secondaryOrg.id}/outsider-receipt.pdf`,
      },
    ],
  });

  await prisma.report.create({
    data: {
      organizationId: secondaryOrg.id,
      createdByUserId: outsider.id,
      reportType: 'EXPENSES_CSV',
      filtersJson: {},
      status: 'COMPLETED',
      fileKey: `${secondaryOrg.id}/reports/existing.csv`,
      completedAt: today,
    },
  });

  return {
    users: { owner, admin, member, outsider, superAdmin },
    organizations: { primaryOrg, secondaryOrg },
    categories: { softwareCategory, travelCategory, betaCategory },
    expenses: { ownerExpense, memberExpense, outsiderExpense },
  };
}
