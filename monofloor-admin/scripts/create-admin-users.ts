import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🔐 Creating admin users...');

  const password = await hashPassword('senha123');

  const users = [
    { email: 'gabriel@monofloor.com.br', name: 'Gabriel Accardo' },
    { email: 'amanda@monofloor.com.br', name: 'Amanda Vantini' },
    { email: 'renata@monofloor.com.br', name: 'Renata' },
    { email: 'joao@monofloor.com.br', name: 'João' },
    { email: 'isa@monofloor.com.br', name: 'Isa' },
  ];

  for (const user of users) {
    const created = await prisma.adminUser.upsert({
      where: { email: user.email },
      update: {
        passwordHash: password,
        isActive: true,
      },
      create: {
        email: user.email,
        passwordHash: password,
        name: user.name,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`✅ Created/Updated: ${created.email}`);
  }

  // Also ensure admin@monofloor.com.br exists with senha123
  const adminPassword = await hashPassword('admin123');
  await prisma.adminUser.upsert({
    where: { email: 'admin@monofloor.com.br' },
    update: {},
    create: {
      email: 'admin@monofloor.com.br',
      passwordHash: adminPassword,
      name: 'Administrador',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin master confirmed');

  console.log('\n🎉 All admin users created successfully!');
  console.log('📧 Emails: gabriel@, amanda@, renata@, joao@, isa@ @monofloor.com.br');
  console.log('🔑 Password: senha123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
