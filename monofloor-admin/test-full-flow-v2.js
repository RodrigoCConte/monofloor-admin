const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Iniciando teste completo de geração de proposta v2...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Captura erros
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ CONSOLE ERROR:', msg.text());
        }
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals') || url.includes('/api/auth')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url + ' -> ' + status);
        }
    });

    try {
        // 1. Login
        console.log('📍 Step 1: Acessando login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        console.log('📍 Step 2: Preenchendo credenciais...');
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
            await emailInput.type('rodrigo@monofloor.com.br', { delay: 30 });
        }

        const passInput = await page.$('input[type="password"]');
        if (passInput) {
            await passInput.type('mono2025', { delay: 30 });
        }

        await page.screenshot({ path: '/tmp/flow2-1-login-filled.png' });
        console.log('📸 Screenshot: /tmp/flow2-1-login-filled.png');

        console.log('📍 Step 3: Clicando em ENTRAR...');
        // Clica no botão submit
        await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
        });

        // Aguarda navegação após login
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ URL após login:', page.url());

        await page.screenshot({ path: '/tmp/flow2-2-after-login.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow2-2-after-login.png');

        // 2. Navegar para CRM/Kanban
        console.log('📍 Step 4: Indo para o dashboard...');
        await page.goto('https://comercial.monofloor.cloud/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 4000));

        await page.screenshot({ path: '/tmp/flow2-3-dashboard.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow2-3-dashboard.png');
        console.log('✅ URL dashboard:', page.url());

        // 3. Verificar elementos na página
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                bodyText: document.body.innerText.substring(0, 500),
                buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0).slice(0, 15)
            };
        });
        console.log('📄 Título:', pageContent.title);
        console.log('📄 Botões:', pageContent.buttons);

        // 4. Procurar card de lead para gerar proposta
        console.log('📍 Step 5: Buscando cards no kanban...');

        // Tenta clicar em um card
        const clickResult = await page.evaluate(() => {
            // Procura elementos que parecem cards
            const selectors = [
                '.lead-card',
                '.deal-card',
                '.kanban-card',
                '[class*="card"][draggable]',
                '.pipeline-card',
                '[data-deal-id]',
                '[data-lead-id]'
            ];

            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    el.click();
                    return 'Clicou usando seletor: ' + sel;
                }
            }

            // Fallback: procura qualquer coisa com "Teste" ou nome de cliente
            const allCards = document.querySelectorAll('[class*="card"]');
            if (allCards.length > 0) {
                allCards[0].click();
                return 'Clicou no primeiro elemento com class card';
            }

            return 'Nenhum card encontrado';
        });
        console.log('🔍 Resultado click:', clickResult);
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: '/tmp/flow2-4-after-card.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow2-4-after-card.png');

        // 5. Verificar se modal abriu e buscar botão gerar proposta
        console.log('📍 Step 6: Buscando botão Gerar Proposta no modal/sidebar...');

        const currentButtons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a[href]')).map(b => ({
                text: b.textContent.trim(),
                tag: b.tagName
            })).filter(b => b.text.length > 0 && b.text.length < 100);
        });
        console.log('🔍 Botões atuais:', JSON.stringify(currentButtons.slice(0, 20), null, 2));

        // Clica no botão de gerar proposta
        const generateClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            for (const btn of buttons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('gerar') || text.includes('proposta') || text.includes('pdf')) {
                    btn.click();
                    return btn.textContent.trim();
                }
            }
            return null;
        });

        if (generateClicked) {
            console.log('✅ Clicou em:', generateClicked);
        } else {
            console.log('⚠️ Botão de gerar proposta não encontrado diretamente');
        }

        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: '/tmp/flow2-5-generate.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow2-5-generate.png');

        // 6. Aguarda e captura resultado
        console.log('⏳ Aguardando processamento (45s)...');
        await new Promise(r => setTimeout(r, 45000));

        await page.screenshot({ path: '/tmp/flow2-6-final.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/flow2-6-final.png');
        console.log('✅ URL final:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/flow2-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído. Browser permanece aberto.');

})();
