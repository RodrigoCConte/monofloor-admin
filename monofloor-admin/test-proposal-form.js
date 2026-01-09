const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste de formulário de proposta...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);
    page.setDefaultTimeout(60000);

    // Captura APIs de proposals
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/proposals')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
            if (method === 'POST') {
                console.log('   🎯 POST DETECTADO!');
            }
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

        // 2. Aguarda pipeline
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const text = await page.evaluate(() => document.body.innerText);
            if (!text.includes('Carregando')) break;
        }
        await new Promise(r => setTimeout(r, 2000));
        console.log('✅ Pipeline carregado');

        // 3. Clica em um lead
        console.log('📍 Selecionando lead...');
        await page.evaluate(() => {
            const cards = document.querySelectorAll('.deal-card');
            if (cards.length > 5) cards[5].click();
            else if (cards.length > 0) cards[0].click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // 4. Clica em Gerar Proposta
        console.log('📍 Abrindo modal Gerar Proposta...');
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent.includes('Gerar Proposta')) {
                    btn.click();
                    break;
                }
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        // 5. Analisa o formulário
        console.log('📍 Analisando formulário...');
        const formElements = await page.evaluate(() => {
            const modal = document.querySelector('[class*="modal"], [class*="dialog"], .drawer, [role="dialog"]') || document.body;

            const inputs = Array.from(modal.querySelectorAll('input')).map(i => ({
                type: i.type,
                name: i.name,
                placeholder: i.placeholder,
                value: i.value,
                className: i.className
            }));

            const selects = Array.from(modal.querySelectorAll('select')).map(s => ({
                name: s.name,
                options: Array.from(s.options).map(o => o.text).slice(0, 5),
                value: s.value
            }));

            const buttons = Array.from(modal.querySelectorAll('button')).map(b => ({
                text: b.textContent.trim(),
                disabled: b.disabled,
                className: b.className
            }));

            // Procura elementos com borda vermelha (validação)
            const redBorder = Array.from(modal.querySelectorAll('*')).filter(el => {
                const style = getComputedStyle(el);
                return style.borderColor.includes('255') || el.className.includes('error') || el.className.includes('invalid');
            }).map(el => el.outerHTML.substring(0, 200));

            return { inputs, selects, buttons, redBorder: redBorder.slice(0, 3) };
        });

        console.log('🔍 Inputs:', JSON.stringify(formElements.inputs, null, 2));
        console.log('🔍 Selects:', JSON.stringify(formElements.selects, null, 2));
        console.log('🔍 Buttons:', formElements.buttons.map(b => b.text + (b.disabled ? ' [DISABLED]' : '')));
        console.log('🔍 Elementos com erro:', formElements.redBorder);

        await page.screenshot({ path: '/tmp/form-1-initial.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/form-1-initial.png');

        // 6. Tenta preencher campos
        console.log('📍 Preenchendo campos...');

        // Se houver select, seleciona primeira opção
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            selects.forEach(s => {
                if (s.options.length > 1) {
                    s.value = s.options[1].value;
                    s.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        // Se houver input de número, preenche
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach(i => {
                if (!i.value && i.name && (i.name.includes('area') || i.name.includes('valor') || i.name.includes('price'))) {
                    i.value = '150';
                    i.dispatchEvent(new Event('input', { bubbles: true }));
                    i.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        await new Promise(r => setTimeout(r, 1000));

        // 7. Clica no botão verde de gerar
        console.log('📍 Clicando em Gerar Proposta (verde)...');
        const clicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent.toLowerCase();
                const style = getComputedStyle(btn);
                const isGreen = style.backgroundColor.includes('34, 197') ||
                               style.backgroundColor.includes('22, 163') ||
                               btn.className.includes('green') ||
                               btn.className.includes('success');

                if (text.includes('gerar') && text.includes('proposta') && !btn.disabled) {
                    console.log('Clicando em:', btn.textContent, 'disabled:', btn.disabled);
                    btn.click();
                    return { text: btn.textContent.trim(), disabled: btn.disabled };
                }
            }

            // Fallback: qualquer botão com "gerar"
            for (const btn of buttons) {
                if (btn.textContent.toLowerCase().includes('gerar') && !btn.disabled) {
                    btn.click();
                    return { text: btn.textContent.trim(), disabled: btn.disabled };
                }
            }

            return null;
        });

        console.log('🔍 Resultado do clique:', clicked);

        await page.screenshot({ path: '/tmp/form-2-after-click.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/form-2-after-click.png');

        // 8. Aguarda resultado
        console.log('⏳ Aguardando resposta...');
        await new Promise(r => setTimeout(r, 10000));

        await page.screenshot({ path: '/tmp/form-3-result.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/form-3-result.png');

        // Verifica URL atual
        console.log('📍 URL:', page.url());

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/form-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído. Browser aberto.');

})();
