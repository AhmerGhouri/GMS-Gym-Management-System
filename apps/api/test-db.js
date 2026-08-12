const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/gms?schema=public'
    }
  }
});

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users in DB:");
    users.forEach(u => console.log(u.email, 'isActive:', u.isActive));
  } catch (e) {
    console.error("App env DB error:", e.message);
  }
  await prisma.$disconnect();
}

main();
