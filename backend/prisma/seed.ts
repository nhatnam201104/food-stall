import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Seed roles ────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'tourist' },
      update: {},
      create: { name: 'tourist', description: 'Khách tham quan' },
    }),
    prisma.role.upsert({
      where: { name: 'merchant' },
      update: {},
      create: { name: 'merchant', description: 'Chủ gian hàng' },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Quản trị viên hệ thống' },
    }),
  ]);

  console.log(`✅ Roles seeded: ${roles.map((r) => r.name).join(', ')}`);

  // ─── Seed admin user ───────────────────────────────────────────────────────
  const adminRole = roles.find((r) => r.name === 'admin')!;
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@audiotourguide.com' },
    update: {},
    create: {
      roleId: adminRole.id,
      fullName: 'System Administrator',
      email: 'admin@audiotourguide.com',
      passwordHash: adminPasswordHash,
      isActive: true,
    },
  });

  console.log(`✅ Admin user: ${adminUser.email} / Admin@123456`);

  console.log('🌱 Seed completed!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
