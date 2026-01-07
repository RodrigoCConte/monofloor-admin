const { chromium } = require('playwright');

async function testAgenteMetragem() {
  console.log('🚀 Testando agente de distribuição de metragens...');
  console.log('');
  console.log('📋 Dados do teste:');
  console.log('   Cliente: Tais');
  console.log('   Detalhes: "90 metros de piso e 50 metros de parede"');
  console.log('   Esperado: Piso = 90, Parede = 50');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar TODOS os logs do console para debug
  page.on('console', msg => {
    console.log(`[BROWSER]`, msg.text());
  });

  try {
    // Simular URL que viria do CRM
    const params = new URLSearchParams({
      cliente: 'Tais',
      cidade: '179',
      telefone: '5511974063797',
      detalhes: '90 metros de piso e 50 metros de parede',
      consultor: 'Gabriel Accardo'
    });

    const url = `https://comercial.monofloor.cloud/geradordepropostas/?${params.toString()}`;
    console.log('📄 Navegando para:', url);
    console.log('');

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Verificar os campos preenchidos
    const metrosPiso = await page.$eval('#metrosPiso', el => el.value);
    const metrosParede = await page.$eval('#metrosParede', el => el.value);
    const detalhes = await page.$eval('#detalhes', el => el.value);
    const nomeCliente = await page.$eval('#nomeCliente', el => el.value);
    const endereco = await page.$eval('#endereco', el => el.value);

    console.log('');
    console.log('📊 CAMPOS PREENCHIDOS:');
    console.log('   Nome Cliente:', nomeCliente);
    console.log('   Endereço:', endereco);
    console.log('   Detalhes:', detalhes || '(vazio)');
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
    }

    // Aguardar para visualização
    console.log('');
    console.log('⏳ Aguardando 5 segundos...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await browser.close();
  process.exit(0);
}

testAgenteMetragem();
