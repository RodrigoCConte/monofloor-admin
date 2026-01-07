const { chromium } = require('playwright');

async function testAreaFinal() {
  console.log('🚀 Testando extração de áreas do parâmetro "area"...');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CRM]') || text.includes('Áreas') || text.includes('extraídas') || text.includes('Detalhes')) {
      console.log(`[BROWSER]`, text);
    }
  });

  try {
    // URL simulada do CRM com parâmetro "area" (igual ao que vem do CRM real)
    const params = new URLSearchParams({
      cliente: 'Tais',
      telefone: '+5511974063797',
      email: 'tataarq@hotmail.com',
      cidade: '179',
      metragem: '140',
      area: '90 metros de piso e 50 metros de parede',
      arquiteto: 'Não',
      dealId: 'a2e8ea65-0fa0-432c-ad08-c239fc61abdc',
      consultor: 'amanda vantini',
      dataPrevistaExec: '2026-03-01'
    });

    const url = `https://comercial.monofloor.cloud/geradordepropostas/?${params.toString()}`;
    console.log('📄 Acessando URL:', url);
    console.log('');

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Verificar os campos preenchidos
    const metrosPiso = await page.$eval('#metrosPiso', el => el.value).catch(() => 'N/A');
    const metrosParede = await page.$eval('#metrosParede', el => el.value).catch(() => 'N/A');
    const nomeCliente = await page.$eval('#nomeCliente', el => el.value).catch(() => 'N/A');
    const endereco = await page.$eval('#endereco', el => el.value).catch(() => 'N/A');

    console.log('');
    console.log('📊 CAMPOS PREENCHIDOS:');
    console.log('   Nome Cliente:', nomeCliente);
    console.log('   Endereço:', endereco);
    console.log('   Metros Piso:', metrosPiso);
    console.log('   Metros Parede:', metrosParede);
    console.log('');

    console.log('🔍 VERIFICAÇÃO METRAGEM:');
    const pisoOk = metrosPiso === '90';
    const paredeOk = metrosParede === '50';
    console.log('   Piso:', pisoOk ? '✅ CORRETO (90)' : `❌ INCORRETO (esperado 90, recebido ${metrosPiso})`);
    console.log('   Parede:', paredeOk ? '✅ CORRETO (50)' : `❌ INCORRETO (esperado 50, recebido ${metrosParede})`);

    if (pisoOk && paredeOk) {
      console.log('');
      console.log('🎉 SUCESSO! Agente de metragem funcionando corretamente!');
    } else {
      console.log('');
      console.log('⚠️ Ainda não está funcionando. O deploy pode não ter sido concluído ainda.');
    }

    // Aguardar para visualização
    console.log('');
    console.log('⏳ Aguardando 10 segundos para visualização...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await browser.close();
  process.exit(0);
}

testAreaFinal();
