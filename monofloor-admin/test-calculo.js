/**
 * Teste automatizado dos cálculos
 * Para rodar: node test-calculo.js
 */

const MAO_OBRA_M2 = 120;
const IMPOSTOS_PERCENT = 0.17;

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcularPrecos(metrosPiso, precoBaseStelion = 910, precoBaseLilit = 590, produtoPisoSelecionado = 'stelion') {
  console.log('\n🔄 Calculando preços...');
  console.log(`   Piso: ${metrosPiso}m² (${produtoPisoSelecionado.toUpperCase()})`);
  console.log(`   Preço Base STELION: R$ ${precoBaseStelion}`);
  console.log(`   Preço Base LILIT: R$ ${precoBaseLilit}`);

  let valorTotalStelion = 0;
  let valorTotalLilit = 0;
  let metragemTotalStelion = 0;
  let metragemTotalLilit = 0;

  // PISO → Depende da seleção
  if (metrosPiso > 0) {
    const metrosComPerda = metrosPiso / 0.9;

    if (produtoPisoSelecionado === 'stelion') {
      valorTotalStelion += metrosComPerda * precoBaseStelion * 1.0;
      metragemTotalStelion += metrosComPerda;
      console.log(`   ✅ PISO: ${metrosComPerda.toFixed(2)}m² × STELION (R$ ${precoBaseStelion}) × 1.0x = R$ ${formatarMoeda(metrosComPerda * precoBaseStelion * 1.0)}`);
    } else {
      valorTotalLilit += metrosComPerda * precoBaseLilit * 1.0;
      metragemTotalLilit += metrosComPerda;
      console.log(`   ✅ PISO: ${metrosComPerda.toFixed(2)}m² × LILIT (R$ ${precoBaseLilit}) × 1.0x = R$ ${formatarMoeda(metrosComPerda * precoBaseLilit * 1.0)}`);
    }
  }

  // Calcular composição de preços
  console.log('\n📊 COMPOSIÇÃO DE PREÇOS:\n');

  console.log('STELION:');
  const impostosStelion = valorTotalStelion * IMPOSTOS_PERCENT;
  const maoObraStelion = MAO_OBRA_M2 * metragemTotalStelion;
  const materiaisStelion = valorTotalStelion - impostosStelion - maoObraStelion;
  console.log(`   Total: R$ ${formatarMoeda(valorTotalStelion)}`);
  console.log(`   - Materiais: R$ ${formatarMoeda(materiaisStelion)}`);
  console.log(`   - Mão de Obra: R$ ${formatarMoeda(maoObraStelion)}`);
  console.log(`   - Impostos (17%): R$ ${formatarMoeda(impostosStelion)}`);

  console.log('\nLILIT:');
  const impostosLilit = valorTotalLilit * IMPOSTOS_PERCENT;
  const maoObraLilit = MAO_OBRA_M2 * metragemTotalLilit;
  const materiaisLilit = valorTotalLilit - impostosLilit - maoObraLilit;
  console.log(`   Total: R$ ${formatarMoeda(valorTotalLilit)}`);
  console.log(`   - Materiais: R$ ${formatarMoeda(materiaisLilit)}`);
  console.log(`   - Mão de Obra: R$ ${formatarMoeda(maoObraLilit)}`);
  console.log(`   - Impostos (17%): R$ ${formatarMoeda(impostosLilit)}`);

  const totalGeral = valorTotalStelion + valorTotalLilit;
  const metragemGeral = metragemTotalStelion + metragemTotalLilit;

  console.log('\n💰 TOTAL GERAL:');
  console.log(`   R$ ${formatarMoeda(totalGeral)} (${metragemGeral.toFixed(2)}m²)`);
  console.log('\n✅ Cálculo concluído!\n');

  return {
    valorTotalStelion,
    valorTotalLilit,
    totalGeral,
    metragemTotalStelion,
    metragemTotalLilit,
    metragemGeral
  };
}

// TESTES
console.log('═══════════════════════════════════════════');
console.log('  TESTE DE CÁLCULOS - MONOFLOOR PROPOSTAS');
console.log('═══════════════════════════════════════════');

console.log('\n📝 TESTE 1: 100m² de Piso STELION');
const teste1 = calcularPrecos(100, 910, 590, 'stelion');

console.log('\n📝 TESTE 2: 100m² de Piso LILIT');
const teste2 = calcularPrecos(100, 910, 590, 'lilit');

console.log('\n═══════════════════════════════════════════');
console.log('  TODOS OS TESTES CONCLUÍDOS ✅');
console.log('═══════════════════════════════════════════\n');
