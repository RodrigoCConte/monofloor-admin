/**
 * Script de teste para a nova função extractAreaDetails
 * Testa a extração de áreas estruturadas a partir de descrições textuais
 */

// Carregar variáveis de ambiente do .env
require('dotenv').config();

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

async function extractAreaDetails(descricao) {
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

  areaDetails.valorEstimado = calcularValorEstimado(areaDetails);

  return areaDetails;
}

// Casos de teste
const testCases = [
  "200 metros de piso",
  "150m² de piso e 80m² de parede",
  "sala de 50m², cozinha 30m², 2 quartos de 15m² cada, bancada de 3m²",
  "area de 8m x 24m mais uma escada de 10 degraus",
  "piso de 180m², parede de 60m², bancada de cozinha 4m² e borda de piscina 15 metros lineares",
];

async function runTests() {
  console.log('═'.repeat(70));
  console.log('TESTE DA FUNÇÃO extractAreaDetails');
  console.log('═'.repeat(70));
  console.log('');

  for (const descricao of testCases) {
    console.log('─'.repeat(70));
    console.log('📝 Descrição:', descricao);
    console.log('─'.repeat(70));

    try {
      const result = await extractAreaDetails(descricao);

      console.log('\n📊 ÁREAS EXTRAÍDAS:');
      console.log(`   Piso:       ${result.piso}m² (STELION × 1.0)`);
      console.log(`   Parede:     ${result.parede}m² (LILIT × 0.8)`);
      console.log(`   Teto:       ${result.teto}m² (LILIT × 0.8)`);
      console.log(`   Bancadas:   ${result.bancadas}m² (STELION × 1.5)`);
      console.log(`   Escadas:    ${result.escadas}m² (STELION × 1.5)`);
      console.log(`   Esp. Peq.:  ${result.especiaisPequenos}m² (STELION × 0.5)`);
      console.log(`   Esp. Gran.: ${result.especiaisGrandes}m² (STELION × 1.5)`);
      console.log(`   Piscina:    ${result.piscina}m² (STELION × 1.5)`);

      console.log('\n💰 CÁLCULO:');
      console.log(`   Metragem Total: ${result.metragemTotal}m²`);
      console.log(`   Valor Estimado: R$ ${result.valorEstimado.toLocaleString('pt-BR')}`);
      console.log(`   Confiança: ${result.confianca}`);

      console.log('\n📋 Detalhamento:', result.detalhamento);

      // Comparar com cálculo simples (R$ 650/m²)
      const valorSimples = result.metragemTotal * 650;
      const diferenca = result.valorEstimado - valorSimples;
      const percentual = ((diferenca / valorSimples) * 100).toFixed(1);
      console.log(`\n📈 Comparação com cálculo simples (R$ 650/m²):`);
      console.log(`   Cálculo simples: R$ ${valorSimples.toLocaleString('pt-BR')}`);
      console.log(`   Diferença: ${diferenca >= 0 ? '+' : ''}R$ ${diferenca.toLocaleString('pt-BR')} (${diferenca >= 0 ? '+' : ''}${percentual}%)`);

    } catch (error) {
      console.error('❌ Erro:', error.message);
    }

    console.log('\n');
  }
}

runTests().catch(console.error);
