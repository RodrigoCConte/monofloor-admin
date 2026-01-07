const { chromium } = require('playwright');

async function testPerda() {
  console.log('🚀 Testando perda de 10% nas superfícies...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SUPERFÍCIES') || text.includes('REQUEST BODY') || text.includes('Dados coletados')) {
      console.log(`[BROWSER]`, text);
    }
  });

  try {
    const url = 'https://comercial.monofloor.cloud/geradordepropostas/';
    console.log('📄 Navegando para:', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Preencher dados básicos
    console.log('📝 Preenchendo dados...');
    await page.fill('#nomeCliente', 'Teste Perda');
    await page.fill('#metrosPiso', '100');
    await page.fill('#metrosParede', '50');
    await page.fill('#metrosTeto', '30');
    await page.waitForTimeout(1000);

    // Verificar os valores calculados na tela
    const metragemOriginal = await page.$eval('#metragemOriginal', el => el.textContent);
    const metragemTotal = await page.$eval('#metragemTotal', el => el.textContent);

    console.log('\n📊 VALORES NA TELA:');
    console.log('  Metragem Original:', metragemOriginal);
    console.log('  Metragem Total (com perda):', metragemTotal);

    // Verificar o código JavaScript no frontend
    const checkCode = await page.evaluate(() => {
      // Verificar se a função de gerar proposta tem a correção
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('Coletar dados de superfície')) {
          // Procurar se tem "/ 0.9" na seção de coleta de dados
          const match = script.textContent.match(/Coletar dados de superfície[\s\S]{0,500}/);
          if (match) {
            return {
              hasCorrection: match[0].includes('/ 0.9'),
              snippet: match[0].substring(0, 300)
            };
          }
        }
      }
      return { hasCorrection: false, snippet: 'Não encontrado' };
    });

    console.log('\n🔍 VERIFICAÇÃO DO CÓDIGO:');
    console.log('  Tem correção (/ 0.9):', checkCode.hasCorrection);
    console.log('  Trecho:', checkCode.snippet.substring(0, 200) + '...');

    // Esperar input manual
    console.log('\n⏳ Página aberta para inspeção. Feche o browser para encerrar...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await browser.close();
  process.exit(0);
}

testPerda();
