const { chromium } = require('playwright');
const fs = require('fs');

async function testPerdaCompleto() {
  console.log('🚀 Testando geração de proposta com perda de 10%...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar request body
  let requestBody = null;
  page.on('request', request => {
    if (request.url().includes('/api/proposals/generate')) {
      try {
        requestBody = JSON.parse(request.postData());
        console.log('\n📤 REQUEST BODY ENVIADO:');
        console.log('  pisoStelion:', requestBody.pisoStelion);
        console.log('  paredeLilit:', requestBody.paredeLilit);
        console.log('  teto:', requestBody.teto);
        console.log('  bancadas:', requestBody.bancadas);
        console.log('  metragemTotal:', requestBody.metragemTotal);

        // Calcular se a perda foi aplicada
        // Se metrosPiso = 100, com perda deveria ser 100/0.9 = 111.11
        console.log('\n🔢 VERIFICAÇÃO:');
        console.log('  Se piso = 100m², com perda deveria ser ~111.11m²');
        console.log('  Se parede = 50m², com perda deveria ser ~55.56m²');
        console.log('  Se teto = 30m², com perda deveria ser ~33.33m²');
      } catch (e) {}
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SUPERFÍCIES DETALHADAS') || text.includes('REQUEST BODY COMPLETO')) {
      console.log(`[BROWSER]`, text.substring(0, 500));
    }
  });

  try {
    const url = 'https://comercial.monofloor.cloud/geradordepropostas/';
    console.log('📄 Navegando para:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Preencher dados
    console.log('📝 Preenchendo dados...');
    await page.fill('#nomeCliente', 'Teste Perda');
    await page.fill('#metrosPiso', '100');
    await page.fill('#metrosParede', '50');
    await page.fill('#metrosTeto', '30');
    await page.waitForTimeout(1000);

    // Verificar valores na tela
    const metragemOriginal = await page.$eval('#metragemOriginal', el => el.textContent);
    const metragemTotal = await page.$eval('#metragemTotal', el => el.textContent);
    console.log('\n📊 VALORES NA TELA:');
    console.log('  Metragem Original:', metragemOriginal);
    console.log('  Metragem Total (com perda):', metragemTotal);

    // Clicar em gerar proposta e capturar download
    console.log('\n🖱️ Clicando em Gerar Proposta...');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 120000 }),
      page.click('#btnGerarProposta')
    ]);

    const downloadPath = '/tmp/proposta-teste-perda.pdf';
    await download.saveAs(downloadPath);
    console.log('✅ PDF baixado para:', downloadPath);

    const stats = fs.statSync(downloadPath);
    console.log('📦 Tamanho do PDF:', stats.size, 'bytes');

    console.log('\n✅ Teste concluído! Verifique o PDF baixado.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await page.waitForTimeout(5000);
  await browser.close();
  process.exit(0);
}

testPerdaCompleto();
