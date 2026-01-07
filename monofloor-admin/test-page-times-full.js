const { chromium } = require('playwright');

async function testPageTimesFull() {
  console.log('🚀 Testando fluxo completo de tracking de tempo por página...');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('tracking') || text.includes('pageTimes') || text.includes('[CRM]') ||
        text.includes('analytics') || text.includes('sendTracking')) {
      console.log(`[BROWSER]`, text);
    }
  });

  let proposalPageUrl = null;

  // Capturar novas abas
  context.on('page', async newPage => {
    const url = newPage.url();
    if (url.includes('/p/') || url.includes('geradordepropostas')) {
      proposalPageUrl = url;
      console.log('🆕 Nova aba detectada:', url);
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

    // 3. Buscar pela Tais
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

    // 5. Verificar se já tem link HTML ou precisamos gerar
    console.log('📝 Passo 4: Verificando/Gerando proposta HTML...');

    // Primeiro, procurar por link HTML existente
    let htmlLinkBtn = await page.$('a.btn--gold[href*="/p/"]');

    if (!htmlLinkBtn) {
      // Procurar botão "Gerar Link HTML"
      const gerarHtmlBtn = await page.$('button:has-text("Gerar Link HTML")');
      if (gerarHtmlBtn) {
        console.log('   Clicando em "Gerar Link HTML"...');
        await gerarHtmlBtn.click();
        await page.waitForTimeout(10000); // Aguardar geração

        // Verificar novamente
        htmlLinkBtn = await page.$('a.btn--gold[href*="/p/"]');
      }
    }

    if (!htmlLinkBtn) {
      // Procurar qualquer link que contenha /p/
      const allLinks = await page.$$('a[href*="/p/"]');
      console.log(`   Encontrados ${allLinks.length} links com /p/`);
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        console.log(`   - ${href}`);
      }

      if (allLinks.length > 0) {
        htmlLinkBtn = allLinks[0];
      }
    }

    if (htmlLinkBtn) {
      const htmlUrl = await htmlLinkBtn.getAttribute('href');
      console.log('   ✅ Link da proposta HTML:', htmlUrl);

      // Determinar URL completa
      const fullUrl = htmlUrl.startsWith('http') ? htmlUrl : `https://devoted-wholeness-production.up.railway.app${htmlUrl}`;
      console.log('   URL completa:', fullUrl);

      // Abrir proposta em nova aba
      console.log('📄 Passo 5: Abrindo proposta HTML...');
      const proposalPage = await context.newPage();

      // Capturar logs da proposta
      proposalPage.on('console', msg => {
        const text = msg.text();
        if (text.includes('tracking') || text.includes('pageTimes') || text.includes('sendTracking') ||
            text.includes('page') || text.includes('scroll')) {
          console.log(`[PROPOSTA]`, text);
        }
      });

      await proposalPage.goto(fullUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log('   ✅ Proposta aberta!');

      // Verificar se tem o tracking script
      const hasTracking = await proposalPage.evaluate(() => {
        return typeof window.proposalTracking !== 'undefined';
      });
      console.log('   Tracking script presente:', hasTracking);

      if (hasTracking) {
        // Verificar dados do tracking
        const trackingData = await proposalPage.evaluate(() => {
          return {
            pageTimes: window.proposalTracking.getPageTimes(),
            currentPage: window.proposalTracking.getCurrentPage(),
            totalTime: window.proposalTracking.getTotalTime(),
            pagesViewed: window.proposalTracking.getPagesViewed()
          };
        });
        console.log('   Dados iniciais do tracking:', JSON.stringify(trackingData));
      }

      // Simular navegação por páginas
      console.log('   📄 Navegando pelas páginas...');

      // Verificar quantas páginas tem
      const pageCount = await proposalPage.$$eval('.page[data-page]', pages => pages.length);
      console.log(`   Total de páginas: ${pageCount}`);

      // Scroll devagar para simular leitura
      for (let i = 0; i < Math.min(pageCount, 5); i++) {
        await proposalPage.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await proposalPage.waitForTimeout(4000); // 4 segundos por página

        if (hasTracking) {
          const currentData = await proposalPage.evaluate(() => {
            return {
              currentPage: window.proposalTracking.getCurrentPage(),
              pageTimes: window.proposalTracking.getPageTimes()
            };
          });
          console.log(`   Página ${currentData.currentPage}: ${JSON.stringify(currentData.pageTimes)}`);
        }
      }

      // Aguardar envio final do tracking
      console.log('   Aguardando envio do tracking (15s)...');
      await proposalPage.waitForTimeout(15000);

      // Verificar dados finais
      if (hasTracking) {
        const finalData = await proposalPage.evaluate(() => {
          return {
            pageTimes: window.proposalTracking.getPageTimes(),
            currentPage: window.proposalTracking.getCurrentPage(),
            totalTime: window.proposalTracking.getTotalTime(),
            pagesViewed: window.proposalTracking.getPagesViewed()
          };
        });
        console.log('   📊 Dados finais do tracking:', JSON.stringify(finalData, null, 2));
      }

      // Fechar proposta
      await proposalPage.close();
      console.log('   ✅ Proposta fechada');

      // Voltar ao CRM e atualizar
      console.log('🔄 Passo 6: Verificando analytics no CRM...');
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

      // Verificar seção de analytics
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
          console.log('   🎉 SUCESSO! Ícone de relatório encontrado!');
          await reportIcons[0].click();
          await page.waitForTimeout(2000);

          // Verificar modal
          const modal = await page.$('.modal--page-times');
          if (modal) {
            console.log('   ✅ Modal aberto!');
            const chartBars = await page.$$('.page-time-bar');
            console.log(`   📊 ${chartBars.length} barras no gráfico`);

            await page.screenshot({ path: '/tmp/page-times-success.png' });
            console.log('   📸 Screenshot salvo em /tmp/page-times-success.png');
          }
        } else {
          console.log('   ❌ Nenhum ícone de relatório encontrado');
          console.log('   Verificando se os dados foram salvos...');

          // Verificar no HTML dos view items
          const viewsHtml = await page.$$eval('.analytics-view-item', items => {
            return items.map(item => item.innerHTML.substring(0, 200));
          });
          console.log('   HTML das views:', viewsHtml);

          await page.screenshot({ path: '/tmp/page-times-no-icon.png' });
          console.log('   📸 Screenshot salvo em /tmp/page-times-no-icon.png');
        }
      } else {
        console.log('   ❌ Seção de analytics não encontrada após visualização');
        await page.screenshot({ path: '/tmp/page-times-no-analytics.png' });
      }

    } else {
      console.log('   ❌ Não foi possível encontrar ou gerar link HTML');
      await page.screenshot({ path: '/tmp/page-times-no-link.png' });
      console.log('   📸 Screenshot salvo em /tmp/page-times-no-link.png');
    }

    // Aguardar para visualização
    console.log('');
    console.log('⏳ Aguardando 10 segundos para visualização...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/page-times-error.png' });
    console.log('📸 Screenshot de erro salvo em /tmp/page-times-error.png');
  }

  await browser.close();
  process.exit(0);
}

testPageTimesFull();
