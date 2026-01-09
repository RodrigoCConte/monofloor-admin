const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste: Gerar proposta com clique no dropdown...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

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

        // 2. Aguarda pipeline
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const hasCards = await page.evaluate(() => document.querySelectorAll('.deal-card').length);
            if (hasCards > 0) {
                console.log('✅ Pipeline carregado');
                break;
            }
        }

        // 3. Clica no lead 50 (que sabemos não ter proposta)
        console.log('📍 Selecionando lead #50...');
        await page.evaluate(() => {
            const cards = document.querySelectorAll('.deal-card');
            if (cards[50]) cards[50].click();
        });
        await new Promise(r => setTimeout(r, 2000));

        // 4. Clica em Gerar Proposta
        console.log('📍 Abrindo modal de proposta...');
        await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const b of btns) {
                if (b.textContent.includes('Gerar Proposta')) {
                    b.click();
                    break;
                }
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: '/tmp/click-1-modal.png', fullPage: true });
        console.log('📸 /tmp/click-1-modal.png');

        // 5. Encontra e clica no dropdown de área (campo vermelho)
        console.log('📍 Clicando no dropdown de área...');

        // Tenta diferentes seletores para o dropdown
        const dropdownClicked = await page.evaluate(() => {
            // Procura por elementos que parecem ser dropdowns/selects
            const selectors = [
                'select',
                '[class*="select"]',
                '[class*="dropdown"]',
                '[role="combobox"]',
                '[role="listbox"]',
                'input[readonly]',
                '[class*="area"]'
            ];

            for (const sel of selectors) {
                const elements = document.querySelectorAll(sel);
                for (const el of elements) {
                    // Verifica se está em vermelho (validação) ou se é select
                    const style = getComputedStyle(el);
                    if (el.tagName === 'SELECT' ||
                        style.borderColor.includes('255') ||
                        el.className.includes('error') ||
                        el.className.includes('invalid')) {
                        el.click();
                        return { selector: sel, element: el.tagName, className: el.className.substring(0, 100) };
                    }
                }
            }

            // Fallback: clica no primeiro select
            const firstSelect = document.querySelector('select');
            if (firstSelect) {
                firstSelect.click();
                return { selector: 'select', element: 'SELECT' };
            }

            return null;
        });

        console.log('🔍 Dropdown:', dropdownClicked);
        await new Promise(r => setTimeout(r, 500));

        // 6. Seleciona a primeira opção válida do select
        console.log('📍 Selecionando opção do dropdown...');
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            for (const s of selects) {
                if (s.options.length > 1) {
                    // Seleciona a segunda opção (índice 1)
                    s.value = s.options[1].value;
                    s.selectedIndex = 1;

                    // Dispara eventos para Vue detectar
                    s.dispatchEvent(new Event('input', { bubbles: true }));
                    s.dispatchEvent(new Event('change', { bubbles: true }));

                    console.log('Selected:', s.options[1].text);
                }
            }
        });
        await new Promise(r => setTimeout(r, 1000));

        await page.screenshot({ path: '/tmp/click-2-selected.png', fullPage: true });
        console.log('📸 /tmp/click-2-selected.png');

        // 7. Verifica se o botão Gerar está habilitado
        const buttonState = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const b of btns) {
                if (b.textContent.includes('Gerar Proposta')) {
                    return { text: b.textContent.trim(), disabled: b.disabled, className: b.className };
                }
            }
            return null;
        });
        console.log('🔍 Botão Gerar:', buttonState);

        // 8. Clica no botão Gerar Proposta
        console.log('📍 Clicando em Gerar Proposta...');
        await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const b of btns) {
                if (b.textContent.includes('Gerar Proposta') && !b.disabled) {
                    b.click();
                    return true;
                }
            }
            return false;
        });

        await page.screenshot({ path: '/tmp/click-3-generating.png', fullPage: true });

        // 9. Aguarda geração
        console.log('⏳ Aguardando geração (2 min)...');
        let proposalUrl = null;

        for (let i = 0; i < 24; i++) {
            await new Promise(r => setTimeout(r, 5000));
            console.log('   ' + ((i+1)*5) + 's...');

            proposalUrl = await page.evaluate(() => {
                const links = document.querySelectorAll('a');
                for (const l of links) {
                    if (l.href && l.href.includes('propostas.monofloor.cloud/p/')) {
                        return l.href;
                    }
                }
                return null;
            });

            if (proposalUrl) {
                console.log('✅ PROPOSTA GERADA: ' + proposalUrl);
                break;
            }
        }

        await page.screenshot({ path: '/tmp/click-4-result.png', fullPage: true });
        console.log('📸 /tmp/click-4-result.png');

        // 10. Se gerou, abre a proposta
        if (proposalUrl) {
            console.log('📍 Abrindo proposta...');
            await page.goto(proposalUrl, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 5000));

            // Vai para página de pagamento
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.95));
            await new Promise(r => setTimeout(r, 2000));

            await page.screenshot({ path: '/tmp/click-5-payment.png', fullPage: false });
            console.log('📸 /tmp/click-5-payment.png');
            console.log('✅ Verifique se o logo está correto!');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/click-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');
})();
