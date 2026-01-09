const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔗 Abrindo CRM...');
  await page.goto('https://comercial.monofloor.cloud');
  await page.waitForTimeout(2000);

  // Verificar se está na página de login
  const loginForm = await page.$('form');
  if (loginForm) {
    console.log('🔐 Fazendo login...');

    // Preencher credenciais
    await page.fill('input[type="email"]', 'amanda@monofloor.com.br');
    await page.fill('input[type="password"]', 'senha123');

    // Clicar no botão de login
    await page.click('button[type="submit"]');

    // Aguardar navegação
    await page.waitForTimeout(2000);
    console.log('✅ Login realizado');
  }

  // Aguardar o pipeline carregar completamente
  console.log('⏳ Aguardando pipeline carregar...');
  try {
    await page.waitForSelector('.pipeline', { timeout: 20000 });
    console.log('✅ Pipeline carregado');
  } catch (e) {
    console.log('⚠️ Timeout aguardando pipeline');
  }

  await page.waitForTimeout(2000);

  // Screenshot do estado após login
  await page.screenshot({ path: '/tmp/crm-after-login.png', fullPage: false });
  console.log('📸 Screenshot após login salvo');

  // Agora o sino deve estar sempre visível no header (ao lado de Filtros e Novo Deal)
  // Verificar se existe o botão de sino
  const notificationBell = await page.$('.notification-bell');
  const notificationBellContainer = await page.$('.notification-bell-container');

  console.log('🔔 Botão de sino existe?', !!notificationBell);
  console.log('📦 Container de sino existe?', !!notificationBellContainer);

  // Se encontrou o sino, clicar nele
  if (notificationBell) {
    console.log('🖱️ Clicando no sino...');
    await notificationBell.click();
    await page.waitForTimeout(1000);

    // Screenshot do painel de notificações
    await page.screenshot({ path: '/tmp/notification-panel.png', fullPage: false });
    console.log('📸 Screenshot do painel salvo');

    // Verificar se o painel abriu
    const panel = await page.$('.notification-panel');
    console.log('📋 Painel aberto?', !!panel);

    // Verificar seções
    const liveSection = await page.$('.notification-panel__section--live');
    const historySection = await page.$('.notification-panel__section--history');
    const emptyState = await page.$('.notification-panel__empty');

    console.log('🟢 Seção AO VIVO?', !!liveSection);
    console.log('📜 Seção HISTÓRICO?', !!historySection);
    console.log('🔍 Estado vazio?', !!emptyState);
  } else {
    console.log('❌ Sino não encontrado! Verificando filters-bar...');
    const filtersBar = await page.$('.filters-bar');
    console.log('🔍 Filters bar existe?', !!filtersBar);

    // Tentar encontrar qualquer botão na filters-bar
    const buttons = await page.$$('.filters-bar button');
    console.log('🔘 Botões na filters-bar:', buttons.length);

    // Screenshot da área de filtros
    await page.screenshot({ path: '/tmp/filters-area.png', fullPage: false });
  }

  await page.waitForTimeout(3000);
  await browser.close();
  console.log('✅ Teste concluído');
})();
