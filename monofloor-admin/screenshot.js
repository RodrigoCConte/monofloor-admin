const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // Login page
  await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/step1_login.png' });
  console.log('Step 1: Login page');
  
  // Preencher formulário
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) inputs[0].value = 'admin@monofloor.com.br';
    if (inputs[1]) inputs[1].value = 'admin123';
  });
  await page.screenshot({ path: '/tmp/step2_filled.png' });
  console.log('Step 2: Form filled');
  
  // Clicar submit
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/step3_after_login.png' });
  console.log('Step 3: After login attempt');
  
  // Ir para comercial
  await page.goto('http://localhost:3000/admin/comercial', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/step4_comercial.png' });
  console.log('Step 4: Comercial page - DONE');
  
  await browser.close();
})();
