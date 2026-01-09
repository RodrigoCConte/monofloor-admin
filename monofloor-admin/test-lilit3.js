const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Abrir navegador visível
  const page = await browser.newPage();
  
  console.log('🔗 Abrindo página...');
  await page.goto('https://comercial.monofloor.cloud/propostas.html');
  await page.waitForTimeout(2000);
  
  // Inserir valor no piso
  console.log('📝 Inserindo 100 m² no campo piso...');
  await page.fill('#metrosPiso', '100');
  await page.waitForTimeout(1000);
  
  // Screenshot antes
  await page.screenshot({ path: '/tmp/antes-lilit.png', fullPage: false });
  console.log('📸 Screenshot ANTES salvo');
  
  // Clicar no botão LILIT
  console.log('🖱️ Clicando no botão LILIT...');
  await page.click('#pisoProdutoLilit');
  await page.waitForTimeout(1500);
  
  // Screenshot depois
  await page.screenshot({ path: '/tmp/depois-lilit.png', fullPage: false });
  console.log('📸 Screenshot DEPOIS salvo');
  
  // Verificar classes do botão
  const stelionActive = await page.$eval('#pisoProdutoStelion', el => el.classList.contains('active'));
  const lilitActive = await page.$eval('#pisoProdutoLilit', el => el.classList.contains('active'));
  console.log('🔘 STELION tem .active?', stelionActive);
  console.log('🔘 LILIT tem .active?', lilitActive);
  
  // Esperar para ver
  console.log('⏳ Aguardando 3 segundos para visualização...');
  await page.waitForTimeout(3000);
  
  await browser.close();
  console.log('✅ Teste concluído');
})();
