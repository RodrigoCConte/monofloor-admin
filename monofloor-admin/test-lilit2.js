const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Interceptar console.log
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('STELION') || text.includes('LILIT') || text.includes('pisoProduto') || text.includes('calcularPrecos')) {
      console.log('BROWSER:', text);
    }
  });
  
  console.log('🔗 Navegando para propostas.html...');
  await page.goto('https://comercial.monofloor.cloud/propostas.html');
  await page.waitForTimeout(2000);
  
  // Inserir valor no piso
  console.log('\n📝 Inserindo 100 m² no campo piso...');
  await page.fill('#metrosPiso', '100');
  await page.waitForTimeout(1000);
  
  // Verificar pisoProduto antes
  const pisoProdutoBefore = await page.evaluate(() => window.pisoProduto || 'undefined');
  console.log('📊 pisoProduto ANTES:', pisoProdutoBefore);
  
  // Clicar no botão LILIT
  console.log('\n🖱️ Clicando no botão LILIT...');
  await page.click('#pisoProdutoLilit');
  await page.waitForTimeout(1000);
  
  // Verificar pisoProduto depois
  const pisoProdutoAfter = await page.evaluate(() => window.pisoProduto || 'undefined');
  console.log('📊 pisoProduto DEPOIS:', pisoProdutoAfter);
  
  // Forçar recálculo
  console.log('\n🔄 Forçando recálculo...');
  await page.evaluate(() => window.calcularPrecos());
  await page.waitForTimeout(500);
  
  await browser.close();
  console.log('\n✅ Teste concluído');
})();
