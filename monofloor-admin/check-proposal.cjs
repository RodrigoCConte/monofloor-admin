const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'], defaultViewport: null });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // 1. Login
  console.log('1. Login...');
  await page.goto('https://comercial.monofloor.cloud', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.type('input[type="email"]', 'amanda@monofloor.com.br');
  await page.type('input[type="password"]', 'senha123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 5000));
  
  // 2. Esperar kanban carregar
  console.log('2. Esperando kanban...');
  await new Promise(r => setTimeout(r, 2000));
  
  // 3. Procurar e clicar diretamente no título "Marjorie Lago Perucci"
  console.log('3. Clicando no card Marjorie...');
  
  // Encontrar o elemento h3 ou span com exatamente esse nome e clicar
  const result = await page.evaluate(() => {
    // Procurar elementos com classe deal-card__name ou similar
    const names = document.querySelectorAll('.deal-card__name, .deal-card h3, .deal-card__title, [class*="deal"] h3, [class*="deal"] .name');
    for (const el of names) {
      if (el.textContent.trim() === 'Marjorie Lago Perucci') {
        // Encontrar o card pai e clicar nele
        let card = el.closest('.deal-card') || el.closest('[class*="deal-card"]');
        if (card) {
          card.click();
          return 'Clicou no card pai: ' + card.className;
        }
        el.click();
        return 'Clicou no elemento: ' + el.className;
      }
    }
    
    // Fallback: procurar qualquer elemento com Marjorie
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.childNodes.length === 1 && el.textContent.trim() === 'Marjorie Lago Perucci') {
        el.click();
        return 'Fallback - clicou em: ' + el.tagName + '.' + el.className;
      }
    }
    return 'não encontrou';
  });
  console.log('Resultado:', result);
  
  // Esperar modal abrir
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/m1-after-click.png' });
  
  // 4. Verificar se modal abriu
  console.log('4. Verificando modal...');
  const modalExists = await page.evaluate(() => {
    const modal = document.querySelector('.deal-modal, .modal, [class*="Modal"], [class*="drawer"], [class*="Drawer"]');
    if (modal) {
      return 'Modal encontrado: ' + modal.className;
    }
    // Verificar se tem overlay/backdrop
    const overlay = document.querySelector('.modal-overlay, .backdrop, [class*="overlay"]');
    if (overlay) return 'Overlay encontrado';
    return 'Nenhum modal';
  });
  console.log(modalExists);
  
  await page.screenshot({ path: '/tmp/m2-modal-check.png' });
  
  // 5. Listar botões visíveis no modal
  const modalButtons = await page.evaluate(() => {
    // Procurar botões dentro de modal ou na parte inferior da tela
    const btns = document.querySelectorAll('.deal-modal button, .modal button, [class*="modal"] button, [class*="Modal"] button');
    if (btns.length > 0) {
      return Array.from(btns).map(b => b.textContent.trim()).filter(t => t);
    }
    // Fallback: todos os botões com texto relevante
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.textContent.trim())
      .filter(t => t.includes('Proposta') || t.includes('HTML') || t.includes('Gerar') || t.includes('Ver'));
  });
  console.log('Botões do modal:', modalButtons);
  
  console.log('5. Mantendo aberto para debug...');
  await new Promise(r => setTimeout(r, 60000));
  
  await browser.close();
})();
