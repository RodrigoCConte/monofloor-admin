const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔗 Abrindo página...');
  await page.goto('https://comercial.monofloor.cloud/propostas.html');
  await page.waitForTimeout(2000);
  
  // Inserir valor no piso
  console.log('📝 Inserindo 100 m² no campo piso...');
  await page.fill('#metrosPiso', '100');
  await page.waitForTimeout(1000);
  
  // Scroll para ver composição de preços
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  
  // Screenshot da composição de preços ANTES
  await page.screenshot({ path: '/tmp/composicao-antes.png', fullPage: false });
  console.log('📸 Screenshot composição ANTES');
  
  // Clicar no LILIT
  console.log('🖱️ Clicando em LILIT...');
  await page.click('#pisoProdutoLilit');
  await page.waitForTimeout(1500);
  
  // Screenshot da composição de preços DEPOIS
  await page.screenshot({ path: '/tmp/composicao-depois.png', fullPage: false });
  console.log('📸 Screenshot composição DEPOIS');
  
  // Aguardar para visualizar
  await page.waitForTimeout(3000);
  
  await browser.close();
  console.log('✅ Concluído');
})();
