const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Iniciando teste com amanda@monofloor.com.br...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Captura erros e API calls
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ CONSOLE:', msg.text());
        }
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
        }
    });

    try {
        // 1. Login
        console.log('📍 Acessando login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));

        console.log('📍 Preenchendo credenciais (amanda@monofloor.com.br)...');
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
            await emailInput.type('amanda@monofloor.com.br', { delay: 30 });
        }

        const passInput = await page.$('input[type="password"]');
        if (passInput) {
            await passInput.type('senha123', { delay: 30 });
        }

        console.log('📍 Clicando em ENTRAR...');
        await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
        });

        // Aguarda navegação após login
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ URL após login:', page.url());

        // Verifica se o login foi bem-sucedido
        const isLoggedIn = !page.url().includes('/login');
        if (!isLoggedIn) {
            console.log('❌ Login falhou - ainda na página de login');

            // Captura mensagem de erro
            const errorMsg = await page.evaluate(() => {
                const error = document.querySelector('[class*="error"], [class*="alert"], .toast');
                return error ? error.textContent.trim() : null;
            });
            if (errorMsg) {
                console.log('❌ Mensagem de erro:', errorMsg);
            }

            await page.screenshot({ path: '/tmp/amanda-login-failed.png' });
            console.log('📸 Screenshot: /tmp/amanda-login-failed.png');
            return;
        }

        await page.screenshot({ path: '/tmp/amanda-1-dashboard.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/amanda-1-dashboard.png');

        // 2. Verificar dashboard
        console.log('📍 Verificando dashboard...');
        const dashInfo = await page.evaluate(() => {
            return {
                title: document.title,
                buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 50).slice(0, 15)
            };
        });
        console.log('📄 Dashboard:', JSON.stringify(dashInfo, null, 2));

        // 3. Buscar card no kanban
        console.log('📍 Buscando cards no kanban...');
        await new Promise(r => setTimeout(r, 3000));

        // Lista os cards disponíveis
        const cards = await page.evaluate(() => {
            const cardElements = document.querySelectorAll('[class*="card"], [draggable="true"], [data-deal-id]');
            return Array.from(cardElements).slice(0, 10).map(c => ({
                className: c.className,
                text: c.textContent.substring(0, 100)
            }));
        });
        console.log('🔍 Cards encontrados:', cards.length);

        // Clica no primeiro card
        const clicked = await page.evaluate(() => {
            const cards = document.querySelectorAll('[class*="card"], [draggable="true"]');
            for (const card of cards) {
                if (card.textContent.length > 10) {
                    card.click();
                    return card.textContent.substring(0, 50);
                }
            }
            return null;
        });
        console.log('🔍 Clicou em:', clicked);
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: '/tmp/amanda-2-after-card.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/amanda-2-after-card.png');

        // 4. Buscar e clicar em "Gerar Proposta"
        console.log('📍 Buscando botão Gerar Proposta...');

        const allButtons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a')).map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 100);
        });
        console.log('🔍 Todos os botões:', allButtons.slice(0, 20));

        const generateClicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, a, span, div'));
            for (const el of elements) {
                const text = el.textContent.toLowerCase();
                if ((text.includes('gerar') && text.includes('proposta')) ||
                    (text.includes('nova') && text.includes('proposta')) ||
                    text === 'gerar proposta' ||
                    text === 'nova proposta') {
                    el.click();
                    return el.textContent.trim();
                }
            }
            return null;
        });

        if (generateClicked) {
            console.log('✅ Clicou em:', generateClicked);
            await new Promise(r => setTimeout(r, 5000));
            await page.screenshot({ path: '/tmp/amanda-3-modal.png', fullPage: true });
            console.log('📸 Screenshot: /tmp/amanda-3-modal.png');

            // Verifica se modal de geração abriu
            const modalButtons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0);
            });
            console.log('🔍 Botões no modal:', modalButtons);

            // Clica no botão de confirmar geração
            const confirmClicked = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase();
                    if (text.includes('gerar') || text.includes('confirmar') || text.includes('criar')) {
                        btn.click();
                        return btn.textContent.trim();
                    }
                }
                return null;
            });
            if (confirmClicked) {
                console.log('✅ Confirmou:', confirmClicked);
            }

            // Aguarda geração
            console.log('⏳ Aguardando geração do PDF (60s)...');
            await new Promise(r => setTimeout(r, 60000));
        } else {
            console.log('⚠️ Botão Gerar Proposta não encontrado');
        }

        await page.screenshot({ path: '/tmp/amanda-4-final.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/amanda-4-final.png');
        console.log('✅ URL final:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/amanda-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído. Browser aberto para inspeção.');

})();
