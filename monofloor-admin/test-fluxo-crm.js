const { chromium } = require('playwright');

async function testFluxoCRM() {
  console.log('🚀 Testando fluxo completo do CRM...');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CRM]') || text.includes('[Agente]') || text.includes('Detalhes') || text.includes('DEBUG')) {
      console.log(`[BROWSER]`, text);
    }
  });

  try {
    // 1. Acessar o CRM
    console.log('📋 Passo 1: Acessando o CRM...');
    await page.goto('https://comercial.monofloor.cloud/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 2. Fazer login se necessário
    const loginInput = await page.$('input[type="email"], input[name="email"]');
    if (loginInput) {
      console.log('🔐 Fazendo login...');
      await page.fill('input[type="email"], input[name="email"]', 'rodrigo@monofloor.com.br');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // 3. Buscar pela Tais usando o telefone
    console.log('🔍 Passo 2: Buscando lead da Tais (5511974063797)...');

    // Procurar campo de busca
    const searchInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"], .search-input input');
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('5511974063797');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ Campo de busca não encontrado, tentando alternativas...');
      // Tentar clicar em algum campo de busca visível
      await page.click('input', { timeout: 5000 }).catch(() => {});
    }

    // 4. Clicar no resultado da busca (lead da Tais)
    console.log('👤 Passo 3: Selecionando lead da Tais...');
    await page.waitForTimeout(1000);

    // Clicar no card ou resultado que contenha "Tais" ou o telefone
    const taisCard = await page.$('text=Tais');
    if (taisCard) {
      await taisCard.click();
      await page.waitForTimeout(2000);
    }

    // 5. Procurar e clicar no botão de Gerar Proposta
    console.log('📝 Passo 4: Clicando em Gerar Proposta...');

    // Tentar diferentes seletores para o botão
    const gerarPropostaBtn = await page.$('button:has-text("Gerar Proposta"), a:has-text("Gerar Proposta"), .gerar-proposta, [title*="proposta"]');
    if (gerarPropostaBtn) {
      // Capturar a URL que será aberta
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }),
        gerarPropostaBtn.click()
      ]).catch(async () => {
        // Se não abrir nova página, talvez seja um link normal
        await gerarPropostaBtn.click();
        return [null];
      });

      if (newPage) {
        console.log('🆕 Nova página aberta:', newPage.url());
        await newPage.waitForLoadState('networkidle');
        await newPage.waitForTimeout(3000);

        // Verificar campos na nova página
        const metrosPiso = await newPage.$eval('#metrosPiso', el => el.value).catch(() => 'N/A');
        const metrosParede = await newPage.$eval('#metrosParede', el => el.value).catch(() => 'N/A');
        const detalhes = await newPage.$eval('#detalhes', el => el.value).catch(() => 'N/A');
        const nomeCliente = await newPage.$eval('#nomeCliente', el => el.value).catch(() => 'N/A');
        const endereco = await newPage.$eval('#endereco', el => el.value).catch(() => 'N/A');

        console.log('');
        console.log('📊 CAMPOS PREENCHIDOS NA PROPOSTA:');
        console.log('   Nome Cliente:', nomeCliente);
        console.log('   Endereço:', endereco);
        console.log('   Detalhes:', detalhes || '(vazio)');
        console.log('   Metros Piso:', metrosPiso);
        console.log('   Metros Parede:', metrosParede);

        // Aguardar para visualização
        console.log('');
        console.log('⏳ Aguardando 15 segundos para visualização...');
        await newPage.waitForTimeout(15000);
      }
    } else {
      console.log('❌ Botão Gerar Proposta não encontrado');

      // Screenshot para debug
      await page.screenshot({ path: '/tmp/crm-debug.png' });
      console.log('📸 Screenshot salvo em /tmp/crm-debug.png');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await page.screenshot({ path: '/tmp/crm-error.png' });
    console.log('📸 Screenshot de erro salvo em /tmp/crm-error.png');
  }

  await browser.close();
  process.exit(0);
}

testFluxoCRM();
