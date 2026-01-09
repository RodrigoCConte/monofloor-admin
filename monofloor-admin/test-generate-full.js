const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste completo de geração de proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Captura APIs
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
        }
    });

    try {
        // 1. Login
        console.log('📍 Step 1: Login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', 'amanda@monofloor.com.br', { delay: 20 });
        await page.type('input[type="password"]', 'senha123', { delay: 20 });
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ Login OK - URL:', page.url());

        // 2. Aguarda carregar o CRM
        console.log('📍 Step 2: Aguardando CRM carregar...');
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: '/tmp/gen-1-crm.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/gen-1-crm.png');

        // 3. Lista os cards disponíveis no kanban
        console.log('📍 Step 3: Buscando leads no kanban...');
        const cards = await page.evaluate(() => {
            const items = document.querySelectorAll('[class*="card"], [draggable="true"], .pipeline-item, .kanban-item, .deal-card');
            return Array.from(items).slice(0, 5).map(c => ({
                text: c.textContent.substring(0, 80).trim(),
                className: c.className
            }));
        });
        console.log('🔍 Cards encontrados:', cards.length);
        cards.forEach((c, i) => console.log('  ' + (i+1) + '. ' + c.text.substring(0, 50)));

        // 4. Clica no primeiro card
        console.log('📍 Step 4: Clicando no primeiro lead...');
        const clickResult = await page.evaluate(() => {
            const cards = document.querySelectorAll('[class*="card"], [draggable="true"]');
            for (const card of cards) {
                if (card.textContent.length > 20) {
                    card.click();
                    return card.textContent.substring(0, 50);
                }
            }
            return null;
        });
        console.log('🔍 Clicou em:', clickResult);
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: '/tmp/gen-2-lead-detail.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/gen-2-lead-detail.png');

        // 5. Busca botões na página
        console.log('📍 Step 5: Buscando botões disponíveis...');
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, [role="button"]'))
                .map(b => b.textContent.trim())
                .filter(t => t.length > 0 && t.length < 50);
        });
        console.log('🔍 Botões:', buttons.slice(0, 20));

        // 6. Procura e clica em "Gerar Proposta"
        console.log('📍 Step 6: Buscando botão Gerar Proposta...');
        const generateClicked = await page.evaluate(() => {
            const elements = document.querySelectorAll('button, a, span, div[role="button"]');
            for (const el of elements) {
                const text = el.textContent.toLowerCase();
                if (text.includes('gerar') && text.includes('proposta')) {
                    el.click();
                    return el.textContent.trim();
                }
                if (text === 'gerar proposta' || text === 'nova proposta') {
                    el.click();
                    return el.textContent.trim();
                }
            }
            return null;
        });

        if (generateClicked) {
            console.log('✅ Clicou em:', generateClicked);
            await new Promise(r => setTimeout(r, 3000));

            await page.screenshot({ path: '/tmp/gen-3-modal.png', fullPage: true });
            console.log('📸 Screenshot: /tmp/gen-3-modal.png');

            // 7. Verifica se há modal de geração
            console.log('📍 Step 7: Verificando modal...');
            const modalButtons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button'))
                    .map(b => b.textContent.trim())
                    .filter(t => t.length > 0);
            });
            console.log('🔍 Botões no modal:', modalButtons);

            // 8. Clica em confirmar/gerar
            const confirmClicked = await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const btn of btns) {
                    const text = btn.textContent.toLowerCase();
                    if (text.includes('gerar') || text.includes('confirmar') || text.includes('criar')) {
                        if (!btn.disabled) {
                            btn.click();
                            return btn.textContent.trim();
                        }
                    }
                }
                return null;
            });

            if (confirmClicked) {
                console.log('✅ Confirmou geração:', confirmClicked);
                console.log('⏳ Aguardando geração do PDF (90s)...');

                // Aguarda geração
                for (let i = 0; i < 18; i++) {
                    await new Promise(r => setTimeout(r, 5000));
                    console.log('   ' + ((i+1) * 5) + 's...');

                    // Verifica se há link de proposta gerada
                    const proposalLink = await page.evaluate(() => {
                        const links = document.querySelectorAll('a[href*="proposta"], a[href*="Proposta"]');
                        if (links.length > 0) {
                            return links[0].href;
                        }
                        return null;
                    });

                    if (proposalLink) {
                        console.log('✅ Proposta gerada:', proposalLink);
                        break;
                    }
                }

                await page.screenshot({ path: '/tmp/gen-4-result.png', fullPage: true });
                console.log('📸 Screenshot: /tmp/gen-4-result.png');
            }
        } else {
            console.log('⚠️ Botão Gerar Proposta não encontrado');

            // Tenta scroll para encontrar
            await page.evaluate(() => window.scrollBy(0, 500));
            await new Promise(r => setTimeout(r, 1000));

            const allText = await page.evaluate(() => document.body.innerText);
            console.log('📄 Texto da página (primeiros 500 chars):', allText.substring(0, 500));
        }

        console.log('📍 URL final:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/gen-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído. Browser aberto para inspeção.');

})();
