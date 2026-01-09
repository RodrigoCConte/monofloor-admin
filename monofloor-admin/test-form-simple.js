const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste simplificado de proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);

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
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const text = await page.evaluate(() => document.body.innerText);
            if (!text.includes('Carregando')) break;
        }
        console.log('✅ Pipeline carregado');

        // 3. Clica em um lead
        console.log('📍 Selecionando lead...');
        await page.evaluate(() => {
            const cards = document.querySelectorAll('.deal-card');
            if (cards[3]) cards[3].click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // 4. Clica em Gerar Proposta
        console.log('📍 Abrindo Gerar Proposta...');
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

        await page.screenshot({ path: '/tmp/simple-1-modal.png', fullPage: true });

        // 5. Lista todos os elementos do formulário
        console.log('📍 Analisando formulário...');
        const formInfo = await page.evaluate(() => {
            const result = {
                inputs: [],
                selects: [],
                buttons: []
            };

            // Inputs
            document.querySelectorAll('input').forEach(i => {
                result.inputs.push({
                    name: i.name || i.id || i.placeholder || 'unnamed',
                    type: i.type,
                    value: i.value
                });
            });

            // Selects
            document.querySelectorAll('select').forEach(s => {
                result.selects.push({
                    name: s.name || s.id || 'unnamed',
                    value: s.value,
                    optionsCount: s.options.length
                });
            });

            // Buttons
            document.querySelectorAll('button').forEach(b => {
                const text = b.textContent.trim();
                if (text.length > 0 && text.length < 50) {
                    result.buttons.push({
                        text: text,
                        disabled: b.disabled
                    });
                }
            });

            return result;
        });

        console.log('🔍 Inputs:', JSON.stringify(formInfo.inputs.slice(0, 10)));
        console.log('🔍 Selects:', JSON.stringify(formInfo.selects));
        console.log('🔍 Buttons:', formInfo.buttons.map(b => b.text + (b.disabled ? ' [X]' : '')).slice(0, 15));

        // 6. Preenche selects
        console.log('📍 Preenchendo selects...');
        await page.evaluate(() => {
            document.querySelectorAll('select').forEach(s => {
                if (s.options.length > 1 && !s.value) {
                    s.selectedIndex = 1;
                    s.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
        await new Promise(r => setTimeout(r, 500));

        // 7. Clica no botão verde de gerar
        console.log('📍 Clicando em Gerar...');
        const btnResult = await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const b of btns) {
                const text = b.textContent.toLowerCase();
                if (text.includes('gerar') && !b.disabled) {
                    b.click();
                    return { clicked: b.textContent.trim(), disabled: b.disabled };
                }
            }
            return null;
        });
        console.log('🔍 Clicou:', btnResult);

        await page.screenshot({ path: '/tmp/simple-2-clicked.png', fullPage: true });

        // 8. Aguarda
        console.log('⏳ Aguardando...');
        await new Promise(r => setTimeout(r, 15000));

        await page.screenshot({ path: '/tmp/simple-3-result.png', fullPage: true });
        console.log('📍 URL:', page.url());

        // 9. Verifica se tem link de proposta
        const proposalLink = await page.evaluate(() => {
            const links = document.querySelectorAll('a');
            for (const l of links) {
                if (l.href && l.href.includes('propostas.monofloor.cloud')) {
                    return l.href;
                }
            }
            return null;
        });

        if (proposalLink) {
            console.log('✅ PROPOSTA:', proposalLink);
        } else {
            console.log('⚠️ Nenhum link de proposta encontrado');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/simple-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');
})();
