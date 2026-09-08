// Uso: node scripts/create-admin.js admin@teusite.com senha123
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.log("Uso: node scripts/create-admin.js <email> <senha>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      passwordHash,
      name: "Admin",
      artistName: "Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin criado/atualizado:", user.email);
}

main().finally(() => prisma.$disconnect());
