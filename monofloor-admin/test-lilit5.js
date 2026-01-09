const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('STELION') || text.includes('LILIT')) {
      console.log('📊', text);
    }
  });
  
  await page.goto('https://comercial.monofloor.cloud/propostas.html');
  await page.waitForTimeout(2000);
  
  // Inserir piso
  await page.fill('#metrosPiso', '100');
  await page.waitForTimeout(1000);
  
  console.log('\n=== ANTES DO CLIQUE LILIT ===');
  
  // Clicar em LILIT
  await page.click('#pisoProdutoLilit');
  await page.waitForTimeout(1500);
  
  console.log('\n=== DEPOIS DO CLIQUE LILIT ===');
  
  // Capturar toda a página
  await page.screenshot({ path: '/tmp/pagina-completa.png', fullPage: true });
  console.log('\n📸 Screenshot página completa salvo em /tmp/pagina-completa.png');
  
  await browser.close();
})();
