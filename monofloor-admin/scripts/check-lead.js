const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const searchName = process.argv[2] || 'Emerson';

async function main() {
  const leads = await prisma.comercialData.findMany({
    where: {
      personName: { contains: searchName, mode: 'insensitive' }
    },
    select: {
      id: true,
      personName: true,
      personEmail: true,
      descritivoArea: true,
      dealValue: true,
      metragemEstimada: true,
      metragemEstimadaN1: true,
      typeformRawData: true,
    }
  });

  if (leads.length === 0) {
    console.log('Nenhum lead encontrado com nome:', searchName);
    return;
  }

  for (const lead of leads) {
    console.log('═'.repeat(60));
    console.log('LEAD: ' + lead.personName);
    console.log('═'.repeat(60));
    console.log('ID:', lead.id);
    console.log('Email:', lead.personEmail);
    console.log('Descrição da Área:', lead.descritivoArea);
    console.log('Metragem Estimada:', lead.metragemEstimada);
    console.log('Faixa (N1):', lead.metragemEstimadaN1);
    console.log('Valor do Deal:', 'R$', parseFloat(lead.dealValue || 0).toLocaleString('pt-BR'));

    // Verificar se tem areaDetails
    const rawData = lead.typeformRawData || {};
    if (rawData.areaDetails) {
      console.log('');
      console.log('─'.repeat(60));
      console.log('DADOS EXTRAÍDOS PELA IA:');
      console.log('─'.repeat(60));
      const ad = rawData.areaDetails;
      console.log('  Piso:', ad.piso, 'm²');
      console.log('  Parede:', ad.parede, 'm²');
      console.log('  Teto:', ad.teto, 'm²');
      console.log('  Bancadas:', ad.bancadas, 'm²');
      console.log('  Escadas:', ad.escadas, 'm²');
      console.log('  Esp. Pequenos:', ad.especiaisPequenos, 'm²');
      console.log('  Esp. Grandes:', ad.especiaisGrandes, 'm²');
      console.log('  Piscina:', ad.piscina, 'm²');
      console.log('  Total:', ad.metragemTotal, 'm²');
      console.log('  Valor Calculado:', 'R$', ad.valorEstimado?.toLocaleString('pt-BR'));
      console.log('  Confiança:', ad.confianca);
      console.log('  Detalhamento:', ad.detalhamento);
    }
    console.log('');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
