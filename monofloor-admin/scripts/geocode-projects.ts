/**
 * Script para geocodificar endereços dos projetos sem coordenadas
 * Executa: npx ts-node scripts/geocode-projects.ts
 */

import { geocodingService } from '../src/services/geocoding.service';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('='.repeat(60));
  console.log('GEOCODING DE PROJETOS - MONOFLOOR');
  console.log('='.repeat(60));

  // Buscar projetos sem coordenadas que tenham endereço válido
  // Filtrar no banco: endereço não é null e não é vazio
  const allProjects = await prisma.project.findMany({
    where: {
      endereco: { not: '' },
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: {
      id: true,
      title: true,
      endereco: true,
    },
  });

  // Filtrar apenas projetos com endereço que parece válido (mínimo 15 caracteres, contém vírgula ou CEP)
  const projects = allProjects.filter(p => {
    if (!p.endereco || p.endereco.trim().length < 15) return false;
    // Deve parecer um endereço (contém rua/avenida/CEP ou vírgula)
    const addr = p.endereco.toLowerCase();
    return addr.includes('rua') || addr.includes('av') || addr.includes('cep') ||
           addr.includes(',') || /\d{5}-?\d{3}/.test(addr);
  });

  console.log(`\n📍 Projetos sem coordenadas: ${projects.length}`);

  if (projects.length === 0) {
    console.log('✅ Todos os projetos já possuem coordenadas!');
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`\n[${i + 1}/${projects.length}] ${project.title}`);
    console.log(`    Endereço: ${project.endereco}`);

    try {
      const result = await geocodingService.geocodeAddress(project.endereco!);

      if (result) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
        });
        console.log(`    ✅ ${result.latitude}, ${result.longitude}`);
        success++;
      } else {
        console.log(`    ⚠️ Não encontrado`);
        failed++;
      }

      // Rate limiting: 100ms entre requisições
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (error: any) {
      console.log(`    ❌ Erro: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('GEOCODING CONCLUÍDO!');
  console.log('='.repeat(60));
  console.log(`\n   ✅ Sucesso: ${success}`);
  console.log(`   ❌ Falha: ${failed}`);
  console.log('\n');

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
