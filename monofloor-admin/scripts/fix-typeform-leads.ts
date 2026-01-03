/**
 * Script para corrigir leads do Typeform sem telefone/email/valor
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRECO_BASE_M2 = 650;

const PRICING_TABLE: Record<string, { midpoint: number }> = {
  'abaixo de 100m2': { midpoint: 75 },
  'de 80m2 a 150m2': { midpoint: 115 },
  'de 100m2 a 250m2': { midpoint: 175 },
  'de 150m2 a 300m2': { midpoint: 225 },
  'de 250m2 a 500m2': { midpoint: 375 },
  'de 300m2 a 500m2': { midpoint: 400 },
  'de 500m2 a 1000m2': { midpoint: 750 },
  'acima de 1000m2': { midpoint: 1500 },
};

function calculateDealValue(metragem: string | null): number | null {
  if (!metragem) return null;
  const metLower = metragem.toLowerCase().trim();

  for (const [faixa, config] of Object.entries(PRICING_TABLE)) {
    if (metLower === faixa.toLowerCase() || metLower.includes(faixa.toLowerCase())) {
      return config.midpoint * PRECO_BASE_M2;
    }
  }

  const rangeMatch = metragem.match(/(\d+)\s*(?:a|até|-)\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    return ((min + max) / 2) * PRECO_BASE_M2;
  }

  const numMatch = metragem.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]) * PRECO_BASE_M2;
  }

  return null;
}

async function main() {
  console.log('Buscando leads para corrigir...');

  // Buscar leads com dados raw do Typeform
  const leads = await prisma.comercialData.findMany({
    where: {
      typeformRawData: { not: undefined },
      dealOrigin: 'form orcamento'
    },
    include: {
      project: true
    }
  });

  console.log(`Encontrados ${leads.length} leads do Typeform para verificar`);

  let fixed = 0;

  for (const lead of leads) {
    const raw = lead.typeformRawData as any;
    if (!raw || !raw.answers) continue;

    const answers = raw.answers;
    let phone: string | null = null;
    let email: string | null = null;
    let metragem: string | null = null;
    let nomeContato: string | null = null;

    for (const a of answers) {
      const ref = a.field?.ref;

      // Telefone - ref d0b8f242
      if (ref === 'd0b8f242-79cb-4e4d-abdf-6e23166a112b' || a.type === 'phone_number') {
        if (a.phone_number) phone = a.phone_number;
      }

      // Email - ref a541a982
      if (ref === 'a541a982-f772-4ec4-a234-364345632d39' || a.type === 'email') {
        if (a.email) email = a.email;
      }

      // Metragem - ref 097fec94
      if (ref === '097fec94-e5a6-4123-949b-b6b21abbdca0') {
        if (a.text) metragem = a.text;
        else if (a.choice?.label) metragem = a.choice.label;
      }

      // Nome contato - ref 002ba554
      if (ref === '002ba554-51ec-49b1-b1fe-3595e9dac660') {
        if (a.text) nomeContato = a.text;
      }
    }

    // Extrair número exato do descritivoArea se disponível
    let metragemExata: number | null = null;
    const descritivoArea = lead.descritivoArea;
    if (descritivoArea) {
      const numMatch = descritivoArea.match(/(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        metragemExata = parseFloat(numMatch[1].replace(',', '.'));
      }
    }

    // Calcular valor: prioridade para valor exato
    let value: number | null = null;
    if (metragemExata && metragemExata > 0) {
      value = metragemExata * PRECO_BASE_M2;
    } else {
      value = calculateDealValue(metragem);
    }

    // Montar updates
    const updates: any = {};

    if (phone && !lead.personPhone) {
      updates.personPhone = phone;
      updates.telefoneZapi = phone;
    }
    if (email && !lead.personEmail) {
      updates.personEmail = email;
    }
    if (metragem && !lead.metragemEstimadaN1) {
      updates.metragemEstimadaN1 = metragem;
    }
    // Atualizar metragemEstimada com valor exato se disponível
    if (metragemExata && (!lead.metragemEstimada || lead.metragemEstimada !== metragemExata.toString())) {
      updates.metragemEstimada = metragemExata.toString();
    }
    // Sempre recalcular valor se temos metragem exata e o valor atual é diferente
    if (value) {
      const currentValue = lead.dealValue ? Number(lead.dealValue) : 0;
      if (currentValue !== value) {
        updates.dealValue = value;
      }
    }
    if (!lead.labelPipedrive) {
      updates.labelPipedrive = 'Novo Lead';
    }

    if (Object.keys(updates).length > 0) {
      await prisma.comercialData.update({
        where: { id: lead.id },
        data: updates
      });

      // Atualizar m2 do projeto com valor exato se disponível
      if (lead.project && metragemExata && metragemExata > 0) {
        const currentM2 = Number(lead.project.m2Total) || 0;
        if (currentM2 !== metragemExata) {
          await prisma.project.update({
            where: { id: lead.project.id },
            data: { m2Total: metragemExata }
          });
        }
      }

      fixed++;
      console.log(`\n[${fixed}] Corrigido: ${lead.personName}`);
      console.log(`   Tel: ${phone || 'N/A'}, Email: ${email || 'N/A'}`);
      console.log(`   Faixa: ${metragem || 'N/A'}, M² Exato: ${metragemExata || 'N/A'}`);
      console.log(`   Valor: R$ ${value?.toLocaleString('pt-BR') || 'N/A'}`);
    }
  }

  console.log('\n=== Resumo ===');
  console.log(`Leads verificados: ${leads.length}`);
  console.log(`Leads corrigidos: ${fixed}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
