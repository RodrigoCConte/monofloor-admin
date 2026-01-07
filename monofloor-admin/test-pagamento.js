const { chromium } = require('playwright');
const fs = require('fs');

async function testPagamento() {
  console.log('🚀 Iniciando teste da página de pagamentos...');

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
      console.log('📤 REQUEST METHOD:', request.method());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/proposals/generate')) {
      console.log('📥 RESPONSE STATUS:', response.status());
      const contentType = response.headers()['content-type'];
      console.log('📥 CONTENT-TYPE:', contentType);
    }
  });

  try {
    // Navegar para a página do gerador
    console.log('📄 Navegando para comercial.monofloor.cloud/geradordepropostas...');
    await page.goto('https://comercial.monofloor.cloud/geradordepropostas', { waitUntil: 'networkidle' });

    // Aguardar a página carregar
    await page.waitForTimeout(2000);

    // Preencher os campos
    console.log('📝 Preenchendo campos...');

    // Cliente
    await page.fill('#nomeCliente', 'Teste Pagamento');
    await page.fill('#endereco', 'Rua Teste, 123');
    await page.fill('#detalhes', 'Teste da página de pagamentos');

    // Metragens
    await page.fill('#metrosPiso', '100');
    await page.fill('#metrosParede', '50');
    await page.fill('#metrosTeto', '30');
    await page.fill('#metrosBancadas', '10');
    await page.fill('#metrosEscadas', '0');
    await page.fill('#metrosEspeciaisPequenos', '0');
    await page.fill('#metrosEspeciaisGrandes', '0');
    await page.fill('#metrosPiscina', '0');

    // Aguardar calcularPrecos ser executado
    await page.waitForTimeout(1000);

    // Verificar os valores dos campos
    console.log('🔍 Verificando valores dos campos...');
    const metrosPiso = await page.$eval('#metrosPiso', el => el.value);
    const metrosParede = await page.$eval('#metrosParede', el => el.value);
    console.log('   metrosPiso:', metrosPiso);
    console.log('   metrosParede:', metrosParede);

    // Clicar no botão de gerar proposta
    console.log('🖱️ Clicando em Gerar Proposta...');

    // Interceptar o download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('#btnGerarProposta')
    ]);

    // Salvar o PDF
    const downloadPath = '/tmp/proposta-teste-pagamento.pdf';
    await download.saveAs(downloadPath);
    console.log('✅ PDF baixado para:', downloadPath);

    // Verificar tamanho do arquivo
    const stats = fs.statSync(downloadPath);
    console.log('📦 Tamanho do PDF:', stats.size, 'bytes');

    console.log('✅ Teste concluído! Verifique o PDF em:', downloadPath);

  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // Manter o navegador aberto por alguns segundos para visualização
  await page.waitForTimeout(5000);
  await browser.close();
  process.exit(0);
}

testPagamento();
