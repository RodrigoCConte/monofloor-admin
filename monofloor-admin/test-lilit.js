const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Interceptar console.log
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('BROWSER:', msg.text());
    }
  });
  
  console.log('🔗 Navegando para propostas.html...');
  await page.goto('https://comercial.monofloor.cloud/propostas.html');
  await page.waitForTimeout(1000);
  
  // Inserir valor no piso
  console.log('📝 Inserindo 100 m² no campo piso...');
  await page.fill('#metrosPiso', '100');
  await page.waitForTimeout(500);
  
  // Ler valores atuais
  const stelionMetragem = await page.$eval('#stelionMetragem', el => el.textContent);
  const lilitMetragem = await page.$eval('#lilitMetragem', el => el.textContent);
  console.log('📊 ANTES do clique LILIT:');
  console.log('   STELION metragem:', stelionMetragem);
  console.log('   LILIT metragem:', lilitMetragem);
  
  // Verificar se o botão LILIT existe
  const lilitBtn = await page.$('#pisoProdutoLilit');
  if (lilitBtn) {
    console.log('✅ Botão LILIT encontrado');
    
    // Verificar classes antes do clique
    const classesBefore = await lilitBtn.evaluate(el => el.className);
    console.log('   Classes antes:', classesBefore);
    
    // Clicar no botão LILIT
    console.log('🖱️ Clicando no botão LILIT...');
    await lilitBtn.click();
    await page.waitForTimeout(1000);
    
    // Verificar classes depois do clique
    const classesAfter = await lilitBtn.evaluate(el => el.className);
    console.log('   Classes depois:', classesAfter);
    
    // Ler valores depois do clique
    const stelionMetragemAfter = await page.$eval('#stelionMetragem', el => el.textContent);
    const lilitMetragemAfter = await page.$eval('#lilitMetragem', el => el.textContent);
    console.log('📊 DEPOIS do clique LILIT:');
    console.log('   STELION metragem:', stelionMetragemAfter);
    console.log('   LILIT metragem:', lilitMetragemAfter);
    
    // Verificar se pisoProduto mudou
    const pisoProdutoValue = await page.evaluate(() => {
      return typeof pisoProduto !== 'undefined' ? pisoProduto : 'UNDEFINED';
    });
    console.log('   Variável pisoProduto:', pisoProdutoValue);
    
  } else {
    console.log('❌ Botão LILIT NÃO encontrado!');
    
    // Listar todos os elementos com produto-option
    const options = await page.$$('.produto-option');
    console.log('   Encontrados', options.length, 'elementos .produto-option');
  }
  
  await browser.close();
  console.log('✅ Teste concluído');
})();
