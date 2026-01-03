const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Lista dos pipefyCardIds importados da planilha
const IMPORTED_CARD_IDS = [
  '1261656694', '1261656719', '1261657059', '1261657122', '1261657151',
  '1261657152', '1261657209', '1261657293', '1261657354', '1261657388',
  '1261657563', '1261657672', '1261658157', '1261658244', '1261658295',
  '1261658482', '1261658658', '1261658748', '1261658841', '1261658855',
  '1261658859', '1261658879', '1261658973', '1261659019', '1261659091',
  '1261659145', '1261659178', '1261659202', '1261659235', '1261659291',
  '1261659330', '1261659404', '1261659448', '1261659573', '1261659580',
  '1261659628', '1261659629', '1261659656', '1261659663', '1261659799',
  '1261659842', '1261659886', '1261659889'
];

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

async function geocodeWithGoogle(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('  ⚠️ GOOGLE_MAPS_API_KEY não configurada!');
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

    console.log(`  ⚠️ Google API status: ${response.data.status}`);
    return null;
  } catch (error) {
    console.error('  ❌ Google geocoding error:', error.message);
    return null;
  }
}

async function processGeocoding() {
  console.log('==============================================');
  console.log('Geocoding dos 44 projetos importados (Google)');
  console.log('==============================================\n');

  if (!GOOGLE_MAPS_API_KEY) {
    console.log('❌ GOOGLE_MAPS_API_KEY não está configurada!');
    console.log('Configure a variável de ambiente e tente novamente.');
    return;
  }

  // Buscar apenas os projetos importados que têm endereço
  const projects = await prisma.project.findMany({
    where: {
      pipefyCardId: { in: IMPORTED_CARD_IDS },
      endereco: { not: null },
    },
    select: {
      id: true,
      title: true,
      endereco: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log(`Encontrados ${projects.length} projetos importados com endereço.\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const project of projects) {
    if (!project.endereco || project.endereco.trim() === '') {
      console.log(`[SKIP] ${project.title} - Sem endereço`);
      skipped++;
      continue;
    }

    // Pular se já tem coordenadas válidas
    if (project.latitude && project.longitude) {
      console.log(`[OK] ${project.title} - Já tem coordenadas`);
      skipped++;
      continue;
    }

    console.log(`[PROCESSING] ${project.title}`);
    console.log(`  Endereço original: ${project.endereco}`);

    const result = await geocodeWithGoogle(project.endereco);

    if (result) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
          endereco: result.formattedAddress, // Atualiza com endereço formatado do Google
        },
      });
      console.log(`  ✓ Endereço atualizado: ${result.formattedAddress}`);
      console.log(`  ✓ Coordenadas: ${result.latitude}, ${result.longitude}`);
      success++;
    } else {
      console.log(`  ✗ Não foi possível geocodificar`);
      failed++;
    }

    // Rate limiting: 50 requests per second para Google Maps API (mais generoso)
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log('\n========================================');
  console.log('Geocoding concluído!');
  console.log(`Sucesso: ${success}`);
  console.log(`Falha: ${failed}`);
  console.log(`Ignorados: ${skipped}`);
  console.log('========================================');
}

processGeocoding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
