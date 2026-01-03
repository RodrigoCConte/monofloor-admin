const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

/**
 * Limpa o endereço para melhor resultado no geocoding
 */
function cleanAddress(address) {
  let cleaned = address;

  // Remove prefixos de cidade/estado no início (ex: "SÃO PAULO/SP Rua...")
  cleaned = cleaned.replace(/^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]+\/[A-Z]{2}\s+/i, '');

  // Remove "nº" e substitui por espaço
  cleaned = cleaned.replace(/\s*nº\s*/gi, ' ');

  // Remove complementos complexos e tudo após eles
  cleaned = cleaned.replace(/,?\s*(apartamento|apto|apt|casa|bloco|bl|torre|cob|cobertura)[^,]*/gi, '');

  // Remove "c X vgs" (X vagas)
  cleaned = cleaned.replace(/\s*c\s*\d+\s*vg[as]*/gi, '');

  // Simplifica CEP - remove a palavra CEP
  cleaned = cleaned.replace(/CEP\s*[-\s]*/gi, '');

  // Remove cidade/estado duplicada no final
  cleaned = cleaned.replace(/,\s*[A-Za-záàâãéèêíìîóòôõúùûç\s]+\/[A-Z]{2}\s*,/gi, ',');

  // Remove espaços múltiplos e vírgulas duplicadas
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/,\s*$/, '');

  return cleaned;
}

/**
 * Geocode using Nominatim (OpenStreetMap) - gratuito
 */
async function geocodeWithNominatim(address) {
  try {
    const cleanedAddress = cleanAddress(address);

    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: cleanedAddress,
          format: 'json',
          countrycodes: 'br',
          limit: 1,
        },
        headers: {
          'User-Agent': 'Monofloor-Admin/1.0 (contact@monofloor.com.br)',
        },
      }
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Nominatim geocoding error:', error.message);
    return null;
  }
}

async function processGeocoding() {
  console.log('Buscando projetos com endereço mas sem coordenadas...\n');

  // Buscar projetos que têm endereço mas não têm latitude/longitude
  const projects = await prisma.project.findMany({
    where: {
      endereco: { not: null },
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

  console.log(`Encontrados ${projects.length} projetos para processar.\n`);

  let success = 0;
  let failed = 0;

  for (const project of projects) {
    if (!project.endereco) {
      console.log(`[SKIP] ${project.title} - Sem endereço`);
      continue;
    }

    console.log(`[PROCESSING] ${project.title}`);
    console.log(`  Endereço: ${project.endereco}`);

    const result = await geocodeWithNominatim(project.endereco);

    if (result) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      });
      console.log(`  ✓ Coordenadas: ${result.latitude}, ${result.longitude}`);
      success++;
    } else {
      console.log(`  ✗ Não foi possível geocodificar`);
      failed++;
    }

    // Rate limiting: 1 request per second para Nominatim
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log('\n========================================');
  console.log('Geocoding concluído!');
  console.log(`Sucesso: ${success}`);
  console.log(`Falha: ${failed}`);
  console.log('========================================');
}

processGeocoding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
