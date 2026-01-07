/**
 * Script para atualizar valores dos leads existentes
 * Usa a nova função extractAreaDetails para recalcular valores
 * baseado na tabela de preços real do gerador de propostas
 *
 * IMPORTANTE: Quando a descrição não contém números específicos,
 * usa o midpoint da faixa selecionada (metragemEstimadaN1) como fallback.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Constantes de precificação (espelho do gerador de propostas)
const PRICING = {
  STELION_BASE: 910,
  LILIT_BASE: 590,
  PERDA: 0.9,
  MULTIPLICADORES: {
    piso: { produto: 'STELION', mult: 1.0 },
    parede: { produto: 'LILIT', mult: 0.8 },
    teto: { produto: 'LILIT', mult: 0.8 },
    bancadas: { produto: 'STELION', mult: 1.5 },
    escadas: { produto: 'STELION', mult: 1.5 },
    especiaisPequenos: { produto: 'STELION', mult: 0.5 },
    especiaisGrandes: { produto: 'STELION', mult: 1.5 },
    piscina: { produto: 'STELION', mult: 1.5 },
  }
};

// Tabela de midpoints por faixa (mesmo do typeform-polling.service.ts)
const METRAGEM_MIDPOINTS = {
  'abaixo de 100m2': 75,
  'de 80m2 a 150m2': 115,
  'de 100m2 a 250m2': 175,
  'de 150m2 a 300m2': 225,
  'de 250m2 a 500m2': 375,
  'de 300m2 a 500m2': 400,
  'de 500m2 a 1000m2': 750,
  'acima de 1000m2': 1500,
};

/**
 * Extrai o midpoint de uma string de faixa de metragem
 * Ex: "de 80m2 a 150m2" → 115
 */
function getMidpointFromFaixa(faixa) {
  if (!faixa) return null;

  const faixaLower = faixa.toLowerCase().trim();

  // Tentar match direto
  for (const [key, midpoint] of Object.entries(METRAGEM_MIDPOINTS)) {
    if (faixaLower.includes(key) || key.includes(faixaLower)) {
      return midpoint;
    }
  }

  // Tentar extrair range (ex: "80 a 150", "150-300")
  const rangeMatch = faixa.match(/(\d+)\s*(?:a|até|-|m2\s*a)\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    return Math.round((min + max) / 2);
  }

  // Tentar extrair número único
  const numMatch = faixa.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  return null;
}

async function callGPT(systemPrompt, userPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function calcularValorEstimado(areas) {
  let valorTotal = 0;
  const tiposArea = ['piso', 'parede', 'teto', 'bancadas', 'escadas', 'especiaisPequenos', 'especiaisGrandes', 'piscina'];

  for (const tipo of tiposArea) {
    const metros = areas[tipo] || 0;
    if (metros <= 0) continue;

    const config = PRICING.MULTIPLICADORES[tipo];
    const metrosComPerda = metros / PRICING.PERDA;
    const precoBase = config.produto === 'STELION' ? PRICING.STELION_BASE : PRICING.LILIT_BASE;

    valorTotal += metrosComPerda * precoBase * config.mult;
  }

  return Math.round(valorTotal);
}

async function extractAreaDetails(descricao, faixaEstimativa = null) {
  // Se não tiver descrição, usa o fallback diretamente
  if (!descricao || descricao.trim().length < 3) {
    console.log(`   📊 Sem descrição válida, usando fallback: ${faixaEstimativa || 150}m²`);
    const defaultResult = {
      piso: faixaEstimativa || 150,
      parede: 0,
      teto: 0,
      bancadas: 0,
      escadas: 0,
      especiaisPequenos: 0,
      especiaisGrandes: 0,
      piscina: 0,
      metragemTotal: faixaEstimativa || 150,
      valorEstimado: 0,
      detalhamento: `Usando midpoint da faixa selecionada (${faixaEstimativa || 150}m²)`,
      confianca: 'baixa'
    };
    defaultResult.valorEstimado = calcularValorEstimado(defaultResult);
    return defaultResult;
  }

  const systemPrompt = `Você é um especialista em orçamentos de aplicação de revestimento STELION/LILIT (piso monolítico).
Sua tarefa é extrair METROS QUADRADOS por tipo de área a partir da descrição do cliente.

TIPOS DE ÁREA (classifique cada área mencionada):
- piso: áreas de piso/chão (sala, quarto, cozinha, área externa, garagem, etc.)
- parede: paredes, muros, revestimentos verticais
- teto: forros, tetos, lajes
- bancadas: bancadas de cozinha, banheiro, churrasqueira, ilhas
- escadas: escadas, degraus
- especiaisPequenos: rodapés, soleiras, pingadeiras (áreas menores que 5m²)
- especiaisGrandes: nichos grandes, detalhes arquitetônicos (áreas maiores que 5m²)
- piscina: bordas de piscina, áreas molhadas de piscina

REGRAS:
1. EXTRAIA a metragem de CADA tipo separadamente
2. Dimensões: "8m x 24m" ou "5 x 10 metros" → MULTIPLIQUE (8 × 24 = 192m²)
3. Rodapé em metros lineares: considere ~0.15m² por metro linear
4. Borda de piscina: considere ~0.3m² por metro linear
5. Se não especificar o tipo, assuma que é PISO
6. Se só mencionar cômodos sem números, retorne todos como 0

RESPONDA APENAS com um objeto JSON:
{
  "piso": número,
  "parede": número,
  "teto": número,
  "bancadas": número,
  "escadas": número,
  "especiaisPequenos": número,
  "especiaisGrandes": número,
  "piscina": número,
  "detalhamento": "explicação breve do que foi interpretado",
  "confianca": "alta" | "media" | "baixa"
}`;

  const userPrompt = `Descrição do projeto:
"${descricao}"

Extraia a metragem por tipo de área em m².`;

  const result = await callGPT(systemPrompt, userPrompt);

  // Remover markdown se o GPT retornar com ```json
  let jsonStr = result.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(jsonStr);

  const areaDetails = {
    piso: parsed.piso || 0,
    parede: parsed.parede || 0,
    teto: parsed.teto || 0,
    bancadas: parsed.bancadas || 0,
    escadas: parsed.escadas || 0,
    especiaisPequenos: parsed.especiaisPequenos || 0,
    especiaisGrandes: parsed.especiaisGrandes || 0,
    piscina: parsed.piscina || 0,
    metragemTotal: 0,
    valorEstimado: 0,
    detalhamento: parsed.detalhamento || '',
    confianca: parsed.confianca || 'media'
  };

  areaDetails.metragemTotal =
    areaDetails.piso + areaDetails.parede + areaDetails.teto +
    areaDetails.bancadas + areaDetails.escadas +
    areaDetails.especiaisPequenos + areaDetails.especiaisGrandes +
    areaDetails.piscina;

  // Se a IA não conseguiu extrair nenhuma metragem, usa o fallback
  if (areaDetails.metragemTotal <= 0 && faixaEstimativa) {
    console.log(`   📊 IA não extraiu números, usando fallback: ${faixaEstimativa}m²`);
    areaDetails.piso = faixaEstimativa;
    areaDetails.metragemTotal = faixaEstimativa;
    areaDetails.detalhamento = `Descrição sem números específicos. Usando midpoint da faixa: ${faixaEstimativa}m² (${areaDetails.detalhamento})`;
    areaDetails.confianca = 'baixa';
  }

  areaDetails.valorEstimado = calcularValorEstimado(areaDetails);

  return areaDetails;
}

// Delay para evitar rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('═'.repeat(70));
  console.log('ATUALIZAÇÃO DE VALORES DOS LEADS EXISTENTES');
  console.log('═'.repeat(70));
  console.log('');

  // Buscar leads com descritivoArea ou metragemEstimadaN1 (para usar como fallback)
  const leads = await prisma.comercialData.findMany({
    where: {
      OR: [
        { descritivoArea: { not: null } },
        { metragemEstimadaN1: { not: null } },
      ],
      dealStatus: 'open',
    },
    select: {
      id: true,
      personName: true,
      descritivoArea: true,
      metragemEstimadaN1: true,
      dealValue: true,
      metragemEstimada: true,
      typeformRawData: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Encontrados ${leads.length} leads com descritivoArea ou metragemEstimadaN1\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let totalValorAntigo = 0;
  let totalValorNovo = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const descricao = lead.descritivoArea;
    const faixaMetragem = lead.metragemEstimadaN1;

    // Calcular midpoint da faixa para usar como fallback
    const midpoint = getMidpointFromFaixa(faixaMetragem);

    // Pular apenas se não tiver nem descrição nem faixa
    if ((!descricao || descricao.trim().length < 3) && !midpoint) {
      console.log(`[${i + 1}/${leads.length}] ${lead.personName} - ⚠️ Sem descrição e sem faixa, pulando...`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${leads.length}] ${lead.personName}`);
    if (descricao) {
      console.log(`   Descrição: "${descricao.substring(0, 60)}${descricao.length > 60 ? '...' : ''}"`);
    }
    if (faixaMetragem) {
      console.log(`   Faixa: ${faixaMetragem} (midpoint: ${midpoint}m²)`);
    }

    try {
      // Passa o midpoint como fallback
      const areaDetails = await extractAreaDetails(descricao, midpoint);

      // Com o fallback, sempre teremos metragem válida
      if (areaDetails.metragemTotal <= 0) {
        console.log(`   ⚠️ Nenhuma metragem calculável, pulando...`);
        skipped++;
        continue;
      }

      const valorAntigo = lead.dealValue ? parseFloat(lead.dealValue) : 0;
      const valorNovo = areaDetails.valorEstimado;
      const diferenca = valorNovo - valorAntigo;

      console.log(`   Áreas: Piso ${areaDetails.piso}m², Parede ${areaDetails.parede}m², Bancadas ${areaDetails.bancadas}m²`);
      console.log(`   Total: ${areaDetails.metragemTotal}m² (confiança: ${areaDetails.confianca})`);
      console.log(`   Valor: R$ ${valorAntigo.toLocaleString('pt-BR')} → R$ ${valorNovo.toLocaleString('pt-BR')} (${diferenca >= 0 ? '+' : ''}${diferenca.toLocaleString('pt-BR')})`);

      // Preparar dados para update
      const existingRawData = lead.typeformRawData || {};
      const updatedRawData = {
        ...existingRawData,
        areaDetails,
        processadoPorIA: true,
        valorCalculadoPorIA: valorNovo,
        atualizadoEm: new Date().toISOString(),
      };

      // Atualizar lead
      await prisma.comercialData.update({
        where: { id: lead.id },
        data: {
          dealValue: valorNovo,
          metragemEstimada: areaDetails.metragemTotal.toString(),
          typeformRawData: updatedRawData,
        },
      });

      console.log(`   ✅ Atualizado!\n`);
      updated++;
      totalValorAntigo += valorAntigo;
      totalValorNovo += valorNovo;

      // Delay para evitar rate limiting (500ms entre requisições)
      await delay(500);

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
      errors++;
    }
  }

  // Resumo
  console.log('\n' + '═'.repeat(70));
  console.log('RESULTADO');
  console.log('═'.repeat(70));
  console.log(`  Total de leads analisados: ${leads.length}`);
  console.log(`  Atualizados: ${updated}`);
  console.log(`  Pulados (sem metragem): ${skipped}`);
  console.log(`  Erros: ${errors}`);
  console.log('');
  console.log(`  Valor total anterior: R$ ${totalValorAntigo.toLocaleString('pt-BR')}`);
  console.log(`  Valor total novo:     R$ ${totalValorNovo.toLocaleString('pt-BR')}`);
  console.log(`  Diferença:            R$ ${(totalValorNovo - totalValorAntigo).toLocaleString('pt-BR')}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
