const { chromium } = require('playwright');

async function testPageTimes() {
  console.log('🚀 Testando fluxo completo de tracking de tempo por página...');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('tracking') || text.includes('pageTimes') || text.includes('[CRM]') || text.includes('analytics')) {
      console.log(`[BROWSER]`, text);
    }
  });

  try {
    // 1. Acessar o CRM e fazer login
    console.log('📋 Passo 1: Acessando o CRM...');
    await page.goto('https://comercial.monofloor.cloud/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const loginBtn = await page.$('button:has-text("ENTRAR")');
    if (loginBtn) {
      console.log('🔐 Fazendo login com Amanda...');
      const emailInput = await page.$('input[placeholder*="email"]');
      if (emailInput) {
        await emailInput.click();
        await emailInput.fill('amanda@monofloor.com.br');
      }
      const senhaInput = await page.$('input[type="password"]');
      if (senhaInput) {
        await senhaInput.click();
        await senhaInput.fill('senha123');
      }
      await loginBtn.click();
      console.log('   Aguardando login...');
      await page.waitForTimeout(8000);
    }

    // 2. Aguardar carregamento dos deals
    console.log('⏳ Aguardando carregamento dos deals...');
    await page.waitForSelector('.deal-card', { timeout: 30000 }).catch(() => {
      console.log('⚠️ Timeout esperando cards');
    });
    await page.waitForTimeout(2000);

    // 3. Buscar pela Tais (que tem proposta)
    console.log('🔍 Passo 2: Buscando lead da Tais...');
    const searchInput = await page.$('input[placeholder*="Buscar"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('974063797');
      await page.waitForTimeout(3000);
    }

    // 4. Clicar no card da Tais
    console.log('👤 Passo 3: Selecionando lead...');
    const taisCard = await page.$('.deal-card');
    if (taisCard) {
      await taisCard.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Card clicado!');
    }

    // 5. Verificar se há seção de analytics
    console.log('📊 Passo 4: Verificando seção de analytics...');

    // Scroll até a seção de analytics
    const analyticsSection = await page.$('.analytics-stats');
    if (analyticsSection) {
      console.log('   ✅ Seção de analytics encontrada!');

      // Verificar views
      const viewItems = await page.$$('.analytics-view-item');
      console.log(`   📈 ${viewItems.length} visualizações encontradas`);

      // Verificar se alguma view tem o ícone de relatório
      const reportIcons = await page.$$('.analytics-view-item__report');
      console.log(`   📊 ${reportIcons.length} views com ícone de relatório`);

      if (reportIcons.length > 0) {
        console.log('   🎉 Ícone de relatório de páginas encontrado!');

        // Clicar no primeiro ícone de relatório
        console.log('   Clicando no ícone de relatório...');
        await reportIcons[0].click();
        await page.waitForTimeout(2000);

        // Verificar se o modal abriu
        const modal = await page.$('.modal--page-times');
        if (modal) {
          console.log('   ✅ Modal de tempo por página aberto!');

          // Verificar conteúdo do modal
          const chartBars = await page.$$('.page-time-bar');
          console.log(`   📊 ${chartBars.length} barras de tempo no gráfico`);

          // Capturar screenshot
          await page.screenshot({ path: '/tmp/page-times-modal.png' });
          console.log('   📸 Screenshot salvo em /tmp/page-times-modal.png');
        } else {
          console.log('   ❌ Modal não abriu');
        }
      } else {
        console.log('   ⚠️ Nenhuma view com dados de páginas ainda');
        console.log('   Isso é esperado para views antigas que não tinham esse tracking');
      }
    } else {
      console.log('   ⚠️ Seção de analytics não encontrada');
      console.log('   Verificando se há proposta gerada...');

      // Verificar se tem botão de gerar proposta
      const gerarPropostaBtn = await page.$('button:has-text("Gerar Proposta")');
      if (gerarPropostaBtn) {
        console.log('   Botão "Gerar Proposta" encontrado - lead não tem proposta ainda');
      }
    }

    // 6. Vamos criar uma nova visualização para testar
    console.log('');
    console.log('📝 Passo 5: Testando tracking em nova visualização...');

    // Buscar URL da proposta HTML se existir
    const htmlLinkBtn = await page.$('a[href*="/p/"]');
    if (htmlLinkBtn) {
      const htmlUrl = await htmlLinkBtn.getAttribute('href');
      console.log('   URL da proposta HTML:', htmlUrl);

      // Abrir proposta em nova aba
      const proposalPage = await context.newPage();
      await proposalPage.goto(htmlUrl.startsWith('http') ? htmlUrl : `https://devoted-wholeness-production.up.railway.app${htmlUrl}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log('   ✅ Proposta aberta!');

      // Simular navegação por páginas
      console.log('   📄 Navegando pelas páginas...');

      // Scroll devagar para simular leitura
      for (let i = 0; i < 5; i++) {
        await proposalPage.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await proposalPage.waitForTimeout(3000); // 3 segundos por página
        console.log(`   Página ${i + 1}...`);
      }

      // Aguardar envio do tracking
      console.log('   Aguardando envio do tracking...');
      await proposalPage.waitForTimeout(5000);

      // Fechar proposta
      await proposalPage.close();
      console.log('   ✅ Proposta fechada');

      // Voltar ao CRM e atualizar
      console.log('   🔄 Atualizando página do CRM...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);

      // Re-buscar a Tais
      const searchInput2 = await page.$('input[placeholder*="Buscar"]');
      if (searchInput2) {
        await searchInput2.click();
        await searchInput2.fill('974063797');
        await page.waitForTimeout(3000);
      }

      const taisCard2 = await page.$('.deal-card');
      if (taisCard2) {
        await taisCard2.click();
        await page.waitForTimeout(3000);
      }

      // Verificar novamente os ícones de relatório
      const reportIcons2 = await page.$$('.analytics-view-item__report');
      console.log(`   📊 Agora: ${reportIcons2.length} views com ícone de relatório`);

      if (reportIcons2.length > 0) {
        console.log('   🎉 SUCESSO! Ícone de relatório apareceu após nova visualização!');
        await reportIcons2[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/page-times-success.png' });
        console.log('   📸 Screenshot salvo em /tmp/page-times-success.png');
      }
    } else {
      console.log('   ⚠️ Não encontrado link para proposta HTML');
    }

    // Aguardar para visualização
    console.log('');
    console.log('⏳ Aguardando 10 segundos para visualização...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await page.screenshot({ path: '/tmp/page-times-error.png' });
    console.log('📸 Screenshot de erro salvo em /tmp/page-times-error.png');
  }

  await browser.close();
  process.exit(0);
}

testPageTimes();
