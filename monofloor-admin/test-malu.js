const { chromium } = require('playwright');
const fs = require('fs');

async function testMalu() {
  console.log('🚀 Testando proposta Malu...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.text().includes('SUPERFÍCIES') || msg.text().includes('REQUEST BODY') || msg.text().includes('GERAR PROPOSTA')) {
      console.log(`[BROWSER]`, msg.text());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/proposals/generate')) {
      console.log('📥 RESPONSE STATUS:', response.status());
    }
  });

  try {
    // Usar a URL exata do usuário
    const url = 'https://comercial.monofloor.cloud/geradordepropostas/?cliente=Malu&telefone=%2B5521981216788&email=malu8malu%40gmail.com&endereco=Rio+de+Janeiro+%28Capital%29&cidade=RJ_CAPITAL&metragem=213&area=chutando+aqui%2C+150m+de+piso%2C+60m+de+parede%2C+20m+lineares+de+rodap%C3%A9&arquiteto=FAMA+Engenharia&dealId=4d0af7bf-ee0f-4281-815c-a596a49f89cc&consultor=Jo%C3%A3o+Farah';

    console.log('📄 Navegando para:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Preencher metragens
    console.log('📝 Preenchendo metragens...');
    await page.fill('#metrosPiso', '150');
    await page.fill('#metrosParede', '60');
    await page.waitForTimeout(1000);

    // Clicar no botão de gerar proposta
    console.log('🖱️ Clicando em Gerar Proposta...');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 120000 }),
      page.click('#btnGerarProposta')
    ]);

    const downloadPath = '/tmp/proposta-malu.pdf';
    await download.saveAs(downloadPath);
    console.log('✅ PDF baixado para:', downloadPath);

    const stats = fs.statSync(downloadPath);
    console.log('📦 Tamanho do PDF:', stats.size, 'bytes');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await page.waitForTimeout(3000);
  await browser.close();
  process.exit(0);
}

testMalu();
