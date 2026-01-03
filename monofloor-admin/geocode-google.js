const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

async function geocodeWithGoogle(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: address,
          key: GOOGLE_MAPS_API_KEY,
          region: 'br',
          language: 'pt-BR',
        },
      }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error('  Error:', error.message);
    return null;
  }
}

async function processGeocoding() {
  console.log('==============================================');
  console.log('Geocoding via Google Maps API');
  console.log('==============================================\n');

  if (!GOOGLE_MAPS_API_KEY) {
    console.log('GOOGLE_MAPS_API_KEY não configurada!');
    return;
  }

  // Buscar projetos COM pipefyCardId (importados da planilha) SEM coordenadas
  const projects = await prisma.project.findMany({
    where: {
      pipefyCardId: { not: null },
      endereco: { not: null },
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: {
      id: true,
      pipefyCardId: true,
      title: true,
      endereco: true,
    },
    take: 100, // Processa em lotes de 100
  });

  console.log(`Encontrados ${projects.length} projetos para processar.\n`);

  let success = 0;
  let failed = 0;

  for (const project of projects) {
    if (!project.endereco || project.endereco.trim() === '' || project.endereco === 'SEM ENDEREÇO') {
      console.log(`[SKIP] ${project.title} - Sem endereço válido`);
      continue;
    }

    console.log(`[${project.pipefyCardId}] ${project.title?.substring(0, 30)}`);
    console.log(`  Original: ${project.endereco.substring(0, 60)}...`);

    const result = await geocodeWithGoogle(project.endereco);

    if (result) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
          endereco: result.formattedAddress, // Atualiza com endereço formatado
        },
      });
      console.log(`  Novo: ${result.formattedAddress.substring(0, 60)}...`);
      console.log(`  Coords: ${result.latitude}, ${result.longitude}`);
      success++;
    } else {
      console.log(`  FALHOU`);
      failed++;
    }

    // Rate limiting: 10 requests per second
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n========================================');
  console.log('Geocoding concluído!');
  console.log(`Sucesso: ${success}`);
  console.log(`Falha: ${failed}`);
  console.log('========================================');

  // Mostrar quantos ainda faltam
  const remaining = await prisma.project.count({
    where: {
      pipefyCardId: { not: null },
      endereco: { not: null },
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
  });

  if (remaining > 0) {
    console.log(`\nAinda faltam ${remaining} projetos. Execute novamente para continuar.`);
  }
}

processGeocoding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
