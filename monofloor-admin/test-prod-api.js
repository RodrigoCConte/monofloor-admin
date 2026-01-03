const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProdAPI() {
  // Get Rodrigo user info for login
  const rodrigo = await prisma.user.findFirst({
    where: { name: { contains: 'Rodrigo', mode: 'insensitive' } }
  });

  if (!rodrigo) {
    console.log('User not found');
    return;
  }

  console.log('Rodrigo email:', rodrigo.email);

  // Get Casa Rodrigo project
  const project = await prisma.project.findFirst({
    where: { cliente: { contains: 'Rodrigo', mode: 'insensitive' } }
  });

  console.log('Project ID:', project?.id);

  await prisma.$disconnect();
}

testProdAPI().catch(console.error);
