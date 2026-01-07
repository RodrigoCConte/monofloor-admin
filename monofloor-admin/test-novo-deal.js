const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Interceptar requisições
  page.on('request', request => {
    if (request.url().includes('/api/admin/comercial') && request.method() === 'POST') {
      console.log('\n📤 POST /api/admin/comercial');
      console.log('Body:', request.postData());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/admin/comercial') && response.request().method() === 'POST') {
      console.log('\n📥 Response:', response.status());
      try {
        const body = await response.json();
        console.log('Data:', JSON.stringify(body, null, 2));
      } catch (e) {}
    }
  });

  // Login
  console.log('🔐 Fazendo login...');
  await page.goto('https://comercial.monofloor.cloud/#/login');
  await page.waitForTimeout(2000);
  
  await page.fill('input[type="email"]', 'admin@monofloor.com.br');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Navegar para Comercial
  console.log('📊 Navegando para Comercial...');
  await page.goto('https://comercial.monofloor.cloud/#/comercial');
  await page.waitForTimeout(4000);
  
  // Clicar em Novo Deal
  console.log('➕ Clicando em Novo Deal...');
  const novoDealBtn = await page.locator('button:has-text("Novo Deal")').first();
  await novoDealBtn.click();
  await page.waitForTimeout(1500);
  
  // Preencher formulário com placeholders corretos
  console.log('📝 Preenchendo formulário...');
  await page.fill('input[placeholder="Ex: João Silva"]', 'TESTE PLAYWRIGHT');
  await page.fill('input[placeholder="(11) 99999-9999"]', '11988887777');
  await page.waitForTimeout(500);
  
  // Verificar se os campos foram preenchidos
  const clienteValue = await page.inputValue('input[placeholder="Ex: João Silva"]');
  const phoneValue = await page.inputValue('input[placeholder="(11) 99999-9999"]');
  console.log('📋 Valores preenchidos:');
  console.log('  - Cliente:', clienteValue);
  console.log('  - Telefone:', phoneValue);
  
  // Verificar botão
  const createBtn = await page.locator('button:has-text("Criar Lead")').first();
  const isEnabled = await createBtn.isEnabled();
  console.log('🔘 Botão "Criar Lead" habilitado:', isEnabled);
  
  if (isEnabled) {
    // Clicar para criar
    console.log('✅ Criando deal...');
    await createBtn.click();
    await page.waitForTimeout(4000);
    
    // Verificar se apareceu o card
    const testeCard = await page.locator('text=TESTE PLAYWRIGHT');
    console.log('\n📋 Resultado:');
    console.log('- Card encontrado:', await testeCard.count() > 0);
    
    // Verificar se houve reload (URL deve ser a mesma)
    const currentUrl = page.url();
    console.log('- URL atual:', currentUrl);
  } else {
    console.log('❌ Botão desabilitado - verificando campos obrigatórios');
    // Screenshot para debug
    await page.screenshot({ path: '/tmp/teste-novo-deal-debug.png', fullPage: true });
    console.log('📸 Screenshot de debug salvo');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();
