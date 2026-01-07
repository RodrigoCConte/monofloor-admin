const { chromium } = require('playwright');

async function testPropostas() {
  console.log('🚀 Iniciando teste com Playwright...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
  });

  // Capturar requisições de rede
  page.on('request', request => {
    if (request.url().includes('/api/proposals/generate')) {
      console.log('📤 REQUEST TO API:', request.url());
      console.log('📤 REQUEST BODY:', request.postData());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/proposals/generate')) {
      console.log('📥 RESPONSE:', response.status());
    }
  });

  try {
    // Navegar para a página
    console.log('📄 Navegando para propostas.monofloor.cloud...');
    await page.goto('https://propostas.monofloor.cloud/propostas.html', { waitUntil: 'networkidle' });

    // Aguardar a página carregar
    await page.waitForTimeout(2000);

    // Preencher os campos
    console.log('📝 Preenchendo campos...');

    // Cliente
    await page.fill('#nomeCliente', 'Teste Playwright');
    await page.fill('#endereco', 'Rua Teste, 123');
    await page.fill('#detalhes', 'Teste automatizado');

    // Metragens
    await page.fill('#metrosPiso', '180');
    await page.fill('#metrosParede', '22');
    await page.fill('#metrosTeto', '44');
    await page.fill('#metrosBancadas', '23');
    await page.fill('#metrosEscadas', '9');
    await page.fill('#metrosEspeciaisPequenos', '33');
    await page.fill('#metrosEspeciaisGrandes', '0');
    await page.fill('#metrosPiscina', '99');

    // Aguardar calcularPrecos ser executado
    await page.waitForTimeout(1000);

    // Verificar os valores dos campos
    console.log('🔍 Verificando valores dos campos...');
    const metrosTeto = await page.$eval('#metrosTeto', el => el.value);
    const metrosBancadas = await page.$eval('#metrosBancadas', el => el.value);
    const metrosPiscina = await page.$eval('#metrosPiscina', el => el.value);
    console.log('   metrosTeto:', metrosTeto);
    console.log('   metrosBancadas:', metrosBancadas);
    console.log('   metrosPiscina:', metrosPiscina);

    // Clicar no botão de gerar proposta
    console.log('🖱️ Clicando em Gerar Proposta...');
    await page.click('#btnGerarProposta');

    // Aguardar a requisição
    await page.waitForTimeout(10000);

    console.log('✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  }

  await browser.close();
  process.exit(0);
}

testPropostas();
