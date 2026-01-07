/**
 * Script de teste para um único lead
 * Verifica se o fallback do midpoint funciona
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Constantes de precificação
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

// Tabela de midpoints
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

function getMidpointFromFaixa(faixa) {
  if (!faixa) return null;
  const faixaLower = faixa.toLowerCase().trim();
  for (const [key, midpoint] of Object.entries(METRAGEM_MIDPOINTS)) {
    if (faixaLower.includes(key) || key.includes(faixaLower)) {
      return midpoint;
    }
  }
  const rangeMatch = faixa.match(/(\d+)\s*(?:a|até|-|m2\s*a)\s*(\d+)/i);
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
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
  if (!descricao || descricao.trim().length < 3) {
    console.log(`📊 Sem descrição válida, usando fallback: ${faixaEstimativa || 150}m²`);
    const defaultResult = {
      piso: faixaEstimativa || 150,
      parede: 0, teto: 0, bancadas: 0, escadas: 0,
      especiaisPequenos: 0, especiaisGrandes: 0, piscina: 0,
      metragemTotal: faixaEstimativa || 150,
      valorEstimado: 0,
      detalhamento: `Usando midpoint da faixa selecionada (${faixaEstimativa || 150}m²)`,
      confianca: 'baixa'
    };
    defaultResult.valorEstimado = calcularValorEstimado(defaultResult);
    return defaultResult;
  }

  const systemPrompt = `Você é um especialista em orçamentos de revestimento STELION/LILIT.
Extraia METROS QUADRADOS por tipo de área da descrição.
Se só mencionar cômodos sem números, retorne todos como 0.
RESPONDA APENAS com JSON:
{"piso": número, "parede": número, "teto": número, "bancadas": número, "escadas": número, "especiaisPequenos": número, "especiaisGrandes": número, "piscina": número, "detalhamento": "...", "confianca": "alta"|"media"|"baixa"}`;

  const result = await callGPT(systemPrompt, `Descrição: "${descricao}"`);

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

  // Se a IA não extraiu, usa o fallback
  if (areaDetails.metragemTotal <= 0 && faixaEstimativa) {
    console.log(`📊 IA retornou 0, usando fallback: ${faixaEstimativa}m²`);
    areaDetails.piso = faixaEstimativa;
    areaDetails.metragemTotal = faixaEstimativa;
    areaDetails.detalhamento = `Descrição sem números. Midpoint da faixa: ${faixaEstimativa}m²`;
    areaDetails.confianca = 'baixa';
  }

  areaDetails.valorEstimado = calcularValorEstimado(areaDetails);
  return areaDetails;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('TESTE - LEAD EMERSON TAVARES');
  console.log('═'.repeat(60));

  const lead = await prisma.comercialData.findFirst({
    where: { personName: { contains: 'Emerson Tavares', mode: 'insensitive' } },
    select: {
      id: true,
      personName: true,
      descritivoArea: true,
      metragemEstimadaN1: true,
      dealValue: true,
      metragemEstimada: true,
    }
  });

  if (!lead) {
    console.log('Lead não encontrado!');
    return;
  }

  console.log('\nDADOS ATUAIS:');
  console.log(`  Nome: ${lead.personName}`);
  console.log(`  Descrição: "${lead.descritivoArea}"`);
  console.log(`  Faixa: ${lead.metragemEstimadaN1}`);
  console.log(`  Metragem atual: ${lead.metragemEstimada}`);
  console.log(`  Valor atual: R$ ${parseFloat(lead.dealValue || 0).toLocaleString('pt-BR')}`);

  const midpoint = getMidpointFromFaixa(lead.metragemEstimadaN1);
  console.log(`\nMIDPOINT CALCULADO: ${midpoint}m²`);

  console.log('\nPROCESSANDO COM IA...');
  const areaDetails = await extractAreaDetails(lead.descritivoArea, midpoint);

  console.log('\nRESULTADO:');
  console.log(`  Piso: ${areaDetails.piso}m²`);
  console.log(`  Total: ${areaDetails.metragemTotal}m²`);
  console.log(`  Valor calculado: R$ ${areaDetails.valorEstimado.toLocaleString('pt-BR')}`);
  console.log(`  Confiança: ${areaDetails.confianca}`);
  console.log(`  Detalhamento: ${areaDetails.detalhamento}`);

  const valorAntigo = parseFloat(lead.dealValue || 0);
  const diferenca = areaDetails.valorEstimado - valorAntigo;
  console.log(`\n  VARIAÇÃO: R$ ${valorAntigo.toLocaleString('pt-BR')} → R$ ${areaDetails.valorEstimado.toLocaleString('pt-BR')} (${diferenca >= 0 ? '+' : ''}R$ ${diferenca.toLocaleString('pt-BR')})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
