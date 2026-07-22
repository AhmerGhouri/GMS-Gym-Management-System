import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany({ include: { memberships: { include: { plan: true } } } });
  console.log(JSON.stringify(members, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
