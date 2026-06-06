import {
  PrismaClient,
  Prisma,
  SubscriptionStatus,
  ExpenseStatus,
  PaymentMethod,
  MembershipRole,
  PlatformRole,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'DemoPass123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.featureFlag.upsert({
    where: { key: 'reports.export.enabled' },
    update: {},
    create: {
      key: 'reports.export.enabled',
      enabled: true,
      description: 'Controls report export availability',
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      defaultCurrency: 'INR',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {
      username: 'demo',
      email: 'demo@finance.local',
      passwordHash,
      fullName: 'Demo User',
      deletedAt: null,
    },
    create: {
      username: 'demo',
      email: 'demo@finance.local',
      passwordHash,
      fullName: 'Demo User',
    },
  });

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      username: 'superadmin',
      email: 'superadmin@finance.local',
      passwordHash,
      fullName: 'Platform Super Admin',
      platformRole: PlatformRole.SUPER_ADMIN,
      deletedAt: null,
    },
    create: {
      username: 'superadmin',
      email: 'superadmin@finance.local',
      passwordHash,
      fullName: 'Platform Super Admin',
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {
      role: MembershipRole.OWNER,
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: MembershipRole.OWNER,
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  });

  const categories = [
    'Software',
    'Travel',
    'Meals',
    'Payroll',
    'Marketing',
    'Utilities',
    'Rent',
    'Other',
  ];

  const categoryRecords = await Promise.all(
    categories.map((name) =>
      prisma.expenseCategory.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name,
          },
        },
        update: { deletedAt: null },
        create: {
          organizationId: organization.id,
          name,
          isDefault: true,
        },
      }),
    ),
  );

  const today = new Date();
  const ratePairs = [
    ['USD', 'INR', 83.42],
    ['EUR', 'INR', 91.35],
    ['INR', 'USD', 0.01199],
    ['INR', 'EUR', 0.01095],
    ['USD', 'EUR', 0.913],
    ['EUR', 'USD', 1.095],
  ] as const;

  await Promise.all(
    ratePairs.map(([baseCurrency, targetCurrency, rate]) =>
      prisma.currencyRate.upsert({
        where: {
          baseCurrency_targetCurrency_rateDate: {
            baseCurrency,
            targetCurrency,
            rateDate: today,
          },
        },
        update: { rate: new Prisma.Decimal(rate) },
        create: {
          baseCurrency,
          targetCurrency,
          rate: new Prisma.Decimal(rate),
          provider: 'seed',
          rateDate: today,
        },
      }),
    ),
  );

  const sampleExpenses = [
    {
      title: 'Adobe Subscription',
      amount: 49.99,
      currency: 'USD',
      convertedAmount: 49.99 * 83.42,
      exchangeRate: 83.42,
      category: 'Software',
      vendorName: 'Adobe',
      expenseDate: new Date('2026-06-01'),
      paymentMethod: PaymentMethod.CARD,
      status: ExpenseStatus.APPROVED,
    },
    {
      title: 'Team Lunch',
      amount: 4200,
      currency: 'INR',
      convertedAmount: 4200,
      exchangeRate: 1,
      category: 'Meals',
      vendorName: 'Cafe Central',
      expenseDate: new Date('2026-06-02'),
      paymentMethod: PaymentMethod.UPI,
      status: ExpenseStatus.SUBMITTED,
    },
    {
      title: 'Meta Ads',
      amount: 300,
      currency: 'USD',
      convertedAmount: 300 * 83.42,
      exchangeRate: 83.42,
      category: 'Marketing',
      vendorName: 'Meta',
      expenseDate: new Date('2026-05-18'),
      paymentMethod: PaymentMethod.CARD,
      status: ExpenseStatus.APPROVED,
    },
    {
      title: 'Office Rent',
      amount: 65000,
      currency: 'INR',
      convertedAmount: 65000,
      exchangeRate: 1,
      category: 'Rent',
      vendorName: 'Skyline Towers',
      expenseDate: new Date('2026-05-05'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: ExpenseStatus.APPROVED,
    },
  ];

  for (const sample of sampleExpenses) {
    const category = categoryRecords.find((item) => item.name === sample.category);
    if (!category) continue;

    const exists = await prisma.expense.findFirst({
      where: {
        organizationId: organization.id,
        createdByUserId: user.id,
        title: sample.title,
        expenseDate: sample.expenseDate,
      },
    });

    if (!exists) {
      await prisma.expense.create({
        data: {
          organizationId: organization.id,
          createdByUserId: user.id,
          categoryId: category.id,
          title: sample.title,
          vendorName: sample.vendorName,
          amount: new Prisma.Decimal(sample.amount),
          currency: sample.currency,
          convertedAmount: new Prisma.Decimal(sample.convertedAmount),
          baseCurrency: 'INR',
          exchangeRate: new Prisma.Decimal(sample.exchangeRate),
          expenseDate: sample.expenseDate,
          paymentMethod: sample.paymentMethod,
          status: sample.status,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
