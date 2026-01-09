const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔗 Abrindo CRM...');
  await page.goto('https://comercial.monofloor.cloud');
  await page.waitForTimeout(3000);
  
  // Screenshot do estado atual
  await page.screenshot({ path: '/tmp/crm-atual.png', fullPage: false });
  console.log('📸 Screenshot salvo');
  
  // Verificar se existe algum elemento de notificação
  const notificationBell = await page.$('.notification-bell');
  const proposalNotifications = await page.$('.proposal-notifications');
  
  console.log('🔔 Botão de sino existe?', !!notificationBell);
  console.log('📋 Painel de notificações existe?', !!proposalNotifications);
  
  // Verificar a filters-bar
  const filtersBar = await page.$('.filters-bar');
  console.log('🔍 Filters bar existe?', !!filtersBar);
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('✅ Verificação concluída');
})();
