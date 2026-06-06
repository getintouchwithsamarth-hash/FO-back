import { PrismaClient } from '@prisma/client';

import { resetDatabase, seedTestDatabase } from '../support/fixtures';

async function main() {
  const prisma = new PrismaClient();

  try {
    await resetDatabase(prisma);
    await seedTestDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
