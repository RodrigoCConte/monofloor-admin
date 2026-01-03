const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lead = await prisma.comercialData.findFirst({
    where: {
      personName: { contains: 'Avelyno', mode: 'insensitive' }
    }
  });

  if (!lead) {
    console.log('Lead Avelyno nao encontrado');
    return;
  }

  console.log('=== Lead Avelyno ===');
  console.log('ID:', lead.id);
  console.log('Nome:', lead.personName);
  console.log('Metragem N1:', lead.metragemEstimadaN1 || 'N/A');
  console.log('Metragem Estimada:', lead.metragemEstimada || 'N/A');
  console.log('Descritivo Area:', lead.descritivoArea || 'N/A');
  console.log('Valor:', lead.dealValue ? 'R$ ' + Number(lead.dealValue).toLocaleString('pt-BR') : 'N/A');

  if (lead.typeformRawData) {
    const raw = lead.typeformRawData;
    const answers = raw.answers || [];
    console.log('');
    console.log('=== Dados Raw do Typeform ===');
    for (const a of answers) {
      const ref = a.field?.ref || 'unknown';
      const shortRef = ref.substring(0, 8);
      if (a.type === 'text') {
        console.log('[' + shortRef + '] text: ' + a.text);
      } else if (a.type === 'choice') {
        console.log('[' + shortRef + '] choice: ' + a.choice?.label);
      }
    }
  }
}

main().then(() => prisma.$disconnect());
