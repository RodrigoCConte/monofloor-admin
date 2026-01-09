const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste de geração v3 - aguardando carregamento completo...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);
    page.setDefaultTimeout(60000);

    // Captura APIs
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals') || url.includes('/api/admin/comercial')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
        }
    });

    try {
        // 1. Login
        console.log('📍 Login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', 'amanda@monofloor.com.br', { delay: 20 });
        await page.type('input[type="password"]', 'senha123', { delay: 20 });
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ Login OK');

        // 2. Aguarda pipeline carregar completamente
        console.log('📍 Aguardando pipeline carregar (até 30s)...');
        let loaded = false;
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));

            const pageText = await page.evaluate(() => document.body.innerText);
            if (!pageText.includes('Carregando')) {
                loaded = true;
                console.log('✅ Pipeline carregado após ' + ((i+1)*2) + 's');
                break;
            }
            console.log('   Aguardando... ' + ((i+1)*2) + 's');
        }

        if (!loaded) {
            console.log('⚠️ Timeout aguardando pipeline');
        }

        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/gen3-1-pipeline.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/gen3-1-pipeline.png');

        // 3. Lista cards do kanban
        console.log('📍 Buscando leads no kanban...');
        const cards = await page.evaluate(() => {
            // Procura cards com diferentes seletores
            const selectors = [
                '.deal-card',
                '.kanban-card',
                '.pipeline-card',
                '[class*="card"][draggable]',
                '[data-deal-id]',
                '.stage-content > div'
            ];

            for (const sel of selectors) {
                const items = document.querySelectorAll(sel);
                if (items.length > 0) {
                    return {
                        selector: sel,
                        count: items.length,
                        samples: Array.from(items).slice(0, 3).map(c => c.textContent.substring(0, 60).trim())
                    };
                }
            }

            // Fallback: qualquer coisa clicável dentro de um container de stage
            const allDivs = document.querySelectorAll('div');
            const clickableDivs = Array.from(allDivs).filter(d =>
                d.textContent.length > 20 &&
                d.textContent.length < 200 &&
                d.draggable
            );

            return {
                selector: 'draggable divs',
                count: clickableDivs.length,
                samples: clickableDivs.slice(0, 3).map(c => c.textContent.substring(0, 60).trim())
            };
        });
        console.log('🔍 Cards:', JSON.stringify(cards, null, 2));

        // 4. Clica no primeiro card disponível
        console.log('📍 Clicando em um lead...');
        const clicked = await page.evaluate(() => {
            // Tenta diferentes seletores
            const selectors = [
                '.deal-card',
                '.kanban-card',
                '.pipeline-card',
                '[draggable="true"]'
            ];

            for (const sel of selectors) {
                const items = document.querySelectorAll(sel);
                for (const item of items) {
                    if (item.textContent.length > 20) {
                        item.click();
                        return { selector: sel, text: item.textContent.substring(0, 50) };
                    }
                }
            }
            return null;
        });

        if (clicked) {
            console.log('✅ Clicou usando:', clicked.selector);
            console.log('   Texto:', clicked.text);
        } else {
            console.log('⚠️ Nenhum card clicável encontrado');
        }

        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: '/tmp/gen3-2-detail.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/gen3-2-detail.png');

        // 5. Busca botão Gerar Proposta
        console.log('📍 Buscando botão Gerar Proposta...');
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a'))
                .map(b => ({
                    text: b.textContent.trim(),
                    tag: b.tagName,
                    disabled: b.disabled
                }))
                .filter(b => b.text.length > 0 && b.text.length < 100);
        });
        console.log('🔍 Botões disponíveis:', buttons.map(b => b.text).slice(0, 15));

        // 6. Clica em Gerar Proposta
        const generateClicked = await page.evaluate(() => {
            const elements = document.querySelectorAll('button, a');
            for (const el of elements) {
                const text = el.textContent.toLowerCase();
                if ((text.includes('gerar') && text.includes('proposta')) ||
                    text === 'gerar proposta' ||
                    text.includes('nova proposta')) {
                    el.click();
                    return el.textContent.trim();
                }
            }
            return null;
        });

        if (generateClicked) {
            console.log('✅ Clicou em Gerar Proposta:', generateClicked);
            await new Promise(r => setTimeout(r, 3000));

            await page.screenshot({ path: '/tmp/gen3-3-modal.png', fullPage: true });
            console.log('📸 Screenshot: /tmp/gen3-3-modal.png');

            // 7. Confirma geração no modal
            console.log('📍 Confirmando geração...');
            const confirmClicked = await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const btn of btns) {
                    const text = btn.textContent.toLowerCase();
                    if ((text.includes('gerar') || text.includes('confirmar')) && !btn.disabled) {
                        btn.click();
                        return btn.textContent.trim();
                    }
                }
                return null;
            });

            if (confirmClicked) {
                console.log('✅ Confirmou:', confirmClicked);
                console.log('⏳ Aguardando geração...');

                // Aguarda até 2 minutos
                for (let i = 0; i < 24; i++) {
                    await new Promise(r => setTimeout(r, 5000));
                    console.log('   ' + ((i+1) * 5) + 's...');

                    // Verifica se há link de proposta
                    const link = await page.evaluate(() => {
                        const links = document.querySelectorAll('a');
                        for (const l of links) {
                            if (l.href && (l.href.includes('proposta') || l.href.includes('Proposta'))) {
                                return l.href;
                            }
                        }
                        // Verifica se apareceu mensagem de sucesso
                        const pageText = document.body.innerText.toLowerCase();
                        if (pageText.includes('proposta gerada') || pageText.includes('sucesso')) {
                            return 'SUCCESS';
                        }
                        return null;
                    });

                    if (link) {
                        console.log('✅ Proposta:', link);
                        break;
                    }
                }

                await page.screenshot({ path: '/tmp/gen3-4-result.png', fullPage: true });
                console.log('📸 Screenshot: /tmp/gen3-4-result.png');
            }
        } else {
            console.log('⚠️ Botão Gerar Proposta não encontrado');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/gen3-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');

})();
