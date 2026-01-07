const { chromium } = require('playwright');

async function testUrlProposta() {
  console.log('🚀 Testando URL gerada pelo botão Gerar Proposta...');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar todas as novas abas abertas
  let capturedUrl = null;
  context.on('page', async newPage => {
    capturedUrl = newPage.url();
    console.log('🆕 Nova aba detectada:', capturedUrl);

    // Parse URL params
    try {
      const url = new URL(capturedUrl);
      console.log('');
      console.log('📊 PARÂMETROS DA URL:');
      for (const [key, value] of url.searchParams) {
        console.log(`   ${key}: ${value}`);
      }

      // Verificar se detalhes está presente
      if (url.searchParams.has('detalhes')) {
        console.log('');
        console.log('✅ Campo DETALHES está presente na URL!');
        console.log('   Conteúdo:', url.searchParams.get('detalhes'));
      } else {
        console.log('');
        console.log('❌ Campo DETALHES NÃO está na URL!');
      }
    } catch (e) {
      console.log('Erro ao parsear URL:', e.message);
    }
  });

  try {
    // 1. Acessar o CRM
    console.log('📋 Passo 1: Acessando o CRM...');
    await page.goto('https://comercial.monofloor.cloud/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 2. Fazer login se necessário
    const loginBtn = await page.$('button:has-text("ENTRAR")');
    if (loginBtn) {
      console.log('🔐 Fazendo login...');
      // Preencher email
      const emailInput = await page.$('input[placeholder*="email"]');
      if (emailInput) {
        await emailInput.click();
        await emailInput.fill('amanda@monofloor.com.br');
      }
      // Preencher senha
      const senhaInput = await page.$('input[type="password"]');
      if (senhaInput) {
        await senhaInput.click();
        await senhaInput.fill('senha123');
      }
      // Clicar no botão ENTRAR
      await loginBtn.click();
      console.log('   Aguardando login...');
      await page.waitForTimeout(8000);
    }

    // 3. Aguardar carregamento dos deals
    console.log('⏳ Aguardando carregamento dos deals...');
    await page.waitForSelector('.deal-card', { timeout: 30000 }).catch(() => {
      console.log('⚠️ Timeout esperando cards, tentando continuar...');
    });
    await page.waitForTimeout(2000);

    // 4. Buscar pela Tais
    console.log('🔍 Passo 2: Buscando lead da Tais (5511974063797)...');

    // Encontrar campo de busca - tentar diferentes seletores
    const searchSelectors = [
      'input[placeholder*="Buscar"]',
      'input[placeholder*="buscar"]',
      'input[type="search"]',
      '.search input',
      '.filters input',
      'input.search'
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      searchInput = await page.$(selector);
      if (searchInput) {
        console.log('   Encontrado campo de busca:', selector);
        break;
      }
    }

    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('974063797');
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ Campo de busca não encontrado, tentando clicar em cards diretamente...');
    }

    // 5. Clicar no card da Tais
    console.log('👤 Passo 3: Selecionando lead da Tais...');

    // Tentar encontrar card da Tais
    const taisCard = await page.$('text=Tais');
    if (taisCard) {
      await taisCard.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Card da Tais clicado!');
    } else {
      console.log('⚠️ Card da Tais não encontrado. Clicando no primeiro card...');
      const firstCard = await page.$('.deal-card');
      if (firstCard) {
        await firstCard.click();
        await page.waitForTimeout(2000);
      }
    }

    // 6. Clicar no botão Gerar Proposta
    console.log('📝 Passo 4: Clicando em Gerar Proposta...');

    // Aguardar o painel lateral abrir
    await page.waitForTimeout(1000);

    // Procurar botão Gerar Proposta
    const propostaBtn = await page.$('button:has-text("Gerar Proposta")');
    if (propostaBtn) {
      console.log('   ✅ Botão encontrado! Clicando...');
      await propostaBtn.click();
      await page.waitForTimeout(5000);

      if (capturedUrl) {
        console.log('');
        console.log('🎉 URL capturada com sucesso!');
      } else {
        console.log('⚠️ Nenhuma nova aba foi aberta');
      }
    } else {
      console.log('❌ Botão "Gerar Proposta" não encontrado');

      // Listar todos os botões disponíveis
      const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(Boolean));
      console.log('   Botões encontrados:', buttons.slice(0, 10).join(', '));

      // Screenshot para debug
      await page.screenshot({ path: '/tmp/crm-debug.png' });
      console.log('📸 Screenshot salvo em /tmp/crm-debug.png');
    }

    // 7. Aguardar para visualização
    console.log('');
    console.log('⏳ Aguardando 10 segundos para visualização...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await page.screenshot({ path: '/tmp/crm-error.png' });
    console.log('📸 Screenshot de erro salvo em /tmp/crm-error.png');
  }

  await browser.close();
  process.exit(0);
}

testUrlProposta();
