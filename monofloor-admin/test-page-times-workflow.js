const { chromium } = require('playwright');

async function testPageTimesWorkflow() {
  console.log('🚀 Testando fluxo completo: Gerar Proposta → HTML → Tracking...');
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('tracking') || text.includes('pageTimes') || text.includes('[CRM]') ||
        text.includes('analytics') || text.includes('sendTracking') || text.includes('page')) {
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

    // 5. Clicar em "Gerar Proposta" para ir ao gerador
    console.log('📝 Passo 4: Clicando em "Gerar Proposta"...');

    // Procurar botão "Gerar Proposta"
    const gerarPropostaBtn = await page.$('button:has-text("Gerar Proposta")');
    if (gerarPropostaBtn) {
      console.log('   Encontrado botão "Gerar Proposta"');

      // Capturar a nova aba que vai abrir
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        gerarPropostaBtn.click()
      ]);

      console.log('   ✅ Nova aba aberta!');
      await newPage.waitForLoadState('networkidle');
      await newPage.waitForTimeout(3000);

      const gerarUrl = newPage.url();
      console.log('   URL do gerador:', gerarUrl);

      // 6. No gerador de propostas, clicar em "Gerar Link HTML"
      console.log('📄 Passo 5: Gerando proposta HTML...');

      // Capturar logs do gerador
      newPage.on('console', msg => {
        const text = msg.text();
        console.log(`[GERADOR]`, text);
      });

      // Fazer scroll até o final da página para encontrar o botão
      console.log('   Fazendo scroll na página do gerador...');
      await newPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await newPage.waitForTimeout(2000);

      // Screenshot para debug
      await newPage.screenshot({ path: '/tmp/workflow-gerador-scroll.png' });

      // Procurar botão de gerar HTML - tentar várias formas
      let gerarHtmlBtn = await newPage.$('button:has-text("Gerar Link HTML")');

      if (!gerarHtmlBtn) {
        gerarHtmlBtn = await newPage.$('button:has-text("HTML")');
      }

      if (!gerarHtmlBtn) {
        // Listar todos os botões para debug
        const allButtons = await newPage.$$eval('button', btns =>
          btns.map(b => ({ text: b.textContent?.trim(), visible: b.offsetParent !== null }))
        );
        console.log('   Botões encontrados:', JSON.stringify(allButtons));
      }
      if (gerarHtmlBtn) {
        console.log('   Encontrado botão "Gerar Link HTML"');
        await gerarHtmlBtn.click();
        console.log('   Aguardando geração...');
        await newPage.waitForTimeout(15000); // Aguardar geração do PDF/HTML

        // Procurar o link gerado
        const htmlLink = await newPage.$('a[href*="/p/"]');
        if (htmlLink) {
          const htmlUrl = await htmlLink.getAttribute('href');
          console.log('   ✅ Link HTML gerado:', htmlUrl);

          // Determinar URL completa
          const fullUrl = htmlUrl.startsWith('http') ? htmlUrl : `https://devoted-wholeness-production.up.railway.app${htmlUrl}`;
          console.log('   URL completa:', fullUrl);

          // 7. Abrir a proposta HTML em nova aba
          console.log('🌐 Passo 6: Abrindo proposta HTML...');
          const proposalPage = await context.newPage();

          // Capturar logs da proposta
          proposalPage.on('console', msg => {
            const text = msg.text();
            console.log(`[PROPOSTA]`, text);
          });

          await proposalPage.goto(fullUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
          });

          console.log('   ✅ Proposta aberta!');
          await proposalPage.waitForTimeout(3000);

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
            console.log('   Dados iniciais:', JSON.stringify(trackingData));
          }

          // 8. Navegar pelas páginas (scroll)
          console.log('📄 Passo 7: Navegando pelas páginas...');

          const pageCount = await proposalPage.$$eval('.page[data-page]', pages => pages.length);
          console.log(`   Total de páginas: ${pageCount}`);

          // Scroll devagar para simular leitura
          for (let i = 0; i < Math.min(pageCount, 6); i++) {
            await proposalPage.evaluate(() => {
              window.scrollBy(0, window.innerHeight);
            });
            await proposalPage.waitForTimeout(5000); // 5 segundos por página

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

          // 9. Aguardar envio final do tracking
          console.log('📤 Passo 8: Aguardando envio do tracking (20s)...');
          await proposalPage.waitForTimeout(20000);

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
            console.log('   📊 Dados finais:', JSON.stringify(finalData, null, 2));
          }

          // Fechar proposta
          await proposalPage.close();
          console.log('   ✅ Proposta fechada');

          // Fechar gerador
          await newPage.close();
          console.log('   ✅ Gerador fechado');

        } else {
          console.log('   ❌ Link HTML não encontrado após geração');
          await newPage.screenshot({ path: '/tmp/workflow-no-html-link.png' });
        }
      } else {
        console.log('   ❌ Botão "Gerar Link HTML" não encontrado');

        // Verificar se já existe um link HTML
        const existingHtmlLink = await newPage.$('a[href*="/p/"]');
        if (existingHtmlLink) {
          console.log('   ℹ️ Link HTML já existe!');
          const htmlUrl = await existingHtmlLink.getAttribute('href');
          console.log('   URL:', htmlUrl);
        }

        await newPage.screenshot({ path: '/tmp/workflow-no-gerar-html.png' });
      }

    } else {
      console.log('   ❌ Botão "Gerar Proposta" não encontrado');

      // Verificar outros botões disponíveis
      const allButtons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(Boolean));
      console.log('   Botões disponíveis:', allButtons);

      await page.screenshot({ path: '/tmp/workflow-no-gerar-proposta.png' });
    }

    // 10. Voltar ao CRM e verificar o painel
    console.log('🔄 Passo 9: Verificando analytics no CRM...');
    await page.bringToFront();
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
          console.log('   ✅ Modal de tempo por página aberto!');
          const chartBars = await page.$$('.page-time-bar');
          console.log(`   📊 ${chartBars.length} barras no gráfico`);

          await page.screenshot({ path: '/tmp/workflow-success.png' });
          console.log('   📸 Screenshot salvo em /tmp/workflow-success.png');
        }
      } else {
        console.log('   ⚠️ Nenhum ícone de relatório encontrado ainda');

        // Verificar HTML das views
        const viewsHtml = await page.$$eval('.analytics-view-item', items => {
          return items.map(item => ({
            html: item.innerHTML.substring(0, 300),
            hasReport: item.querySelector('.analytics-view-item__report') !== null
          }));
        });
        console.log('   Detalhes das views:', JSON.stringify(viewsHtml, null, 2));

        await page.screenshot({ path: '/tmp/workflow-no-report.png' });
      }
    } else {
      console.log('   ❌ Seção de analytics não encontrada');
      await page.screenshot({ path: '/tmp/workflow-no-analytics.png' });
    }

    // Aguardar para visualização
    console.log('');
    console.log('⏳ Aguardando 15 segundos para visualização...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/workflow-error.png' });
    console.log('📸 Screenshot de erro salvo em /tmp/workflow-error.png');
  }

  await browser.close();
  process.exit(0);
}

testPageTimesWorkflow();
