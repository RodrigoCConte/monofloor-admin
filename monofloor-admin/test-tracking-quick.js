const { chromium } = require('playwright');

async function testTrackingQuick() {
  console.log('🚀 Teste rápido de tracking de proposta...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capturar TODAS as requisições de rede
  page.on('request', req => {
    if (req.url().includes('/track')) {
      console.log('📤 REQUEST:', req.method(), req.url());
      const postData = req.postData();
      if (postData) {
        console.log('   DATA:', postData);
      }
    }
  });

  page.on('response', res => {
    if (res.url().includes('/track')) {
      console.log('📥 RESPONSE:', res.status(), res.url());
    }
  });

  // Capturar logs do console
  page.on('console', msg => {
    console.log(`[BROWSER]`, msg.text());
  });

  try {
    // Acessar proposta da Tais diretamente
    const proposalUrl = 'https://devoted-wholeness-production.up.railway.app/p/2026/Proposta_Tais_be184a';
    console.log('📄 Acessando proposta:', proposalUrl);

    await page.goto(proposalUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Verificar se o tracking script está presente
    const hasTracking = await page.evaluate(() => {
      return typeof window.proposalTracking !== 'undefined';
    });
    console.log('✅ Tracking script presente:', hasTracking);

    if (hasTracking) {
      const trackingData = await page.evaluate(() => {
        return {
          pageTimes: window.proposalTracking.getPageTimes(),
          currentPage: window.proposalTracking.getCurrentPage(),
          totalTime: window.proposalTracking.getTotalTime(),
          pagesViewed: window.proposalTracking.getPagesViewed()
        };
      });
      console.log('📊 Dados do tracking:', JSON.stringify(trackingData, null, 2));
    }

    // Navegar pelas páginas
    console.log('📄 Navegando pelas páginas...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(3000);

      if (hasTracking) {
        const data = await page.evaluate(() => ({
          currentPage: window.proposalTracking.getCurrentPage(),
          pageTimes: window.proposalTracking.getPageTimes()
        }));
        console.log(`   Página ${data.currentPage}:`, JSON.stringify(data.pageTimes));
      }
    }

    // Aguardar envio do tracking
    console.log('⏳ Aguardando envio do tracking (10s)...');
    await page.waitForTimeout(10000);

    if (hasTracking) {
      const finalData = await page.evaluate(() => ({
        pageTimes: window.proposalTracking.getPageTimes(),
        totalTime: window.proposalTracking.getTotalTime()
      }));
      console.log('📊 Dados finais:', JSON.stringify(finalData, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  await browser.close();
  process.exit(0);
}

testTrackingQuick();
