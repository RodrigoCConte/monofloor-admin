const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste robusto de proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(60000);

    // Captura APIs
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals') && !url.includes('track')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
        }
    });

    try {
        // 1. Login
        console.log('📍 Login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'amanda@monofloor.com.br');
        await page.type('input[type="password"]', 'senha123');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 5000));
        console.log('✅ Login OK');

        // 2. Aguarda pipeline carregar COMPLETAMENTE
        console.log('📍 Aguardando pipeline carregar (até 60s)...');
        let loaded = false;
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 2000));

            const hasCards = await page.evaluate(() => {
                const cards = document.querySelectorAll('.deal-card');
                const loading = document.body.innerText.includes('Carregando');
                return { cards: cards.length, loading };
            });

            console.log('   ' + ((i+1)*2) + 's - Cards: ' + hasCards.cards + ', Loading: ' + hasCards.loading);

            if (hasCards.cards > 0 && !hasCards.loading) {
                loaded = true;
                console.log('✅ Pipeline carregado com ' + hasCards.cards + ' cards');
                break;
            }
        }

        if (!loaded) {
            console.log('❌ Timeout aguardando pipeline');
            await page.screenshot({ path: '/tmp/robust-timeout.png', fullPage: true });
            return;
        }

        await page.screenshot({ path: '/tmp/robust-1-pipeline.png', fullPage: true });
        console.log('📸 /tmp/robust-1-pipeline.png');

        // 3. Clica em um lead (aguardando estar clicável)
        console.log('📍 Selecionando lead...');
        await page.waitForSelector('.deal-card', { visible: true });
        await new Promise(r => setTimeout(r, 1000));

        await page.evaluate(() => {
            const cards = document.querySelectorAll('.deal-card');
            if (cards[2]) cards[2].click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // 4. Aguarda drawer/modal abrir
        console.log('📍 Aguardando detalhes do lead...');
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: '/tmp/robust-2-lead.png', fullPage: true });
        console.log('📸 /tmp/robust-2-lead.png');

        // 5. Busca e clica em "Gerar Proposta"
        console.log('📍 Buscando botão Gerar Proposta...');
        const gerarBtn = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            const list = [];
            for (const b of btns) {
                const text = b.textContent.trim();
                list.push(text);
                if (text.includes('Gerar Proposta')) {
                    b.click();
                    return { found: true, text };
                }
            }
            return { found: false, buttons: list.filter(t => t.length > 0 && t.length < 50).slice(0, 20) };
        });

        console.log('🔍 Resultado:', JSON.stringify(gerarBtn));

        if (!gerarBtn.found) {
            console.log('❌ Botão Gerar Proposta não encontrado');
            return;
        }

        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: '/tmp/robust-3-modal.png', fullPage: true });
        console.log('📸 /tmp/robust-3-modal.png');

        // 6. Analisa o modal de geração
        console.log('📍 Analisando modal...');
        const modalInfo = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'))
                .map(b => ({ text: b.textContent.trim(), disabled: b.disabled }))
                .filter(b => b.text.length > 0 && b.text.length < 50);

            const hasGerarBtn = buttons.some(b =>
                b.text.toLowerCase().includes('gerar') &&
                b.text.toLowerCase().includes('proposta')
            );

            return { buttons, hasGerarBtn };
        });

        console.log('🔍 Botões:', modalInfo.buttons.map(b => b.text + (b.disabled ? '[X]' : '')));

        // 7. Clica no botão de gerar no modal
        if (modalInfo.hasGerarBtn) {
            console.log('📍 Clicando em Gerar Proposta no modal...');
            const clicked = await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const b of btns) {
                    const text = b.textContent.toLowerCase();
                    if (text.includes('gerar') && text.includes('proposta') && !b.disabled) {
                        b.click();
                        return b.textContent.trim();
                    }
                }
                return null;
            });
            console.log('✅ Clicou em:', clicked);

            // 8. Aguarda geração
            console.log('⏳ Aguardando geração (2 min)...');
            let proposalUrl = null;

            for (let i = 0; i < 24; i++) {
                await new Promise(r => setTimeout(r, 5000));
                console.log('   ' + ((i+1)*5) + 's...');

                proposalUrl = await page.evaluate(() => {
                    // Procura link de proposta
                    const links = document.querySelectorAll('a');
                    for (const l of links) {
                        if (l.href && l.href.includes('propostas.monofloor.cloud/p/')) {
                            return l.href;
                        }
                    }
                    // Procura input com URL
                    const inputs = document.querySelectorAll('input');
                    for (const i of inputs) {
                        if (i.value && i.value.includes('propostas.monofloor.cloud')) {
                            return i.value;
                        }
                    }
                    return null;
                });

                if (proposalUrl) {
                    console.log('✅ PROPOSTA GERADA: ' + proposalUrl);
                    break;
                }
            }

            await page.screenshot({ path: '/tmp/robust-4-result.png', fullPage: true });
            console.log('📸 /tmp/robust-4-result.png');

            // 9. Se tiver URL, abre a proposta
            if (proposalUrl) {
                console.log('📍 Abrindo proposta...');
                await page.goto(proposalUrl, { waitUntil: 'networkidle2' });
                await new Promise(r => setTimeout(r, 5000));

                await page.screenshot({ path: '/tmp/robust-5-proposal.png', fullPage: true });
                console.log('📸 /tmp/robust-5-proposal.png');
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/robust-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');
})();
