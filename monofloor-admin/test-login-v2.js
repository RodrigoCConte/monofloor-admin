const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste de login v2 - amanda@monofloor.com.br...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Captura TODAS as requests de API
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/')) {
            const method = response.request().method();
            const status = response.status();
            console.log('📡 ' + method + ' ' + url.split('?')[0] + ' -> ' + status);
            if (status >= 400) {
                try {
                    const body = await response.text();
                    console.log('   ❌ Body:', body.substring(0, 200));
                } catch(e) {}
            }
        }
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ CONSOLE:', msg.text());
        }
    });

    try {
        // 1. Acessa login
        console.log('📍 Acessando login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // 2. Aguarda formulário
        await page.waitForSelector('input[type="email"]', { visible: true });
        console.log('✅ Formulário visível');

        // 3. Preenche email
        console.log('📍 Preenchendo email...');
        await page.click('input[type="email"]');
        await page.type('input[type="email"]', 'amanda@monofloor.com.br', { delay: 20 });

        // 4. Preenche senha
        console.log('📍 Preenchendo senha...');
        await page.click('input[type="password"]');
        await page.type('input[type="password"]', 'senha123', { delay: 20 });

        await new Promise(r => setTimeout(r, 500));

        // 5. Screenshot antes de clicar
        await page.screenshot({ path: '/tmp/login-v2-1-before-click.png' });
        console.log('📸 Screenshot: /tmp/login-v2-1-before-click.png');

        // 6. Clica no botão usando JavaScript
        console.log('📍 Clicando no botão ENTRAR...');
        await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) {
                btn.click();
                console.log('Botão clicado via JS');
            }
        });

        // 7. Aguarda resposta da API ou navegação
        console.log('⏳ Aguardando resposta...');
        await new Promise(r => setTimeout(r, 5000));

        // 8. Verifica se ainda está na página de login
        const currentUrl = page.url();
        console.log('📍 URL atual:', currentUrl);

        await page.screenshot({ path: '/tmp/login-v2-2-after-click.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/login-v2-2-after-click.png');

        if (currentUrl.includes('/login')) {
            console.log('⚠️ Ainda na página de login');

            // Verifica se há mensagem de erro
            const pageContent = await page.evaluate(() => document.body.innerText);
            if (pageContent.includes('incorret') || pageContent.includes('inválid') || pageContent.includes('erro')) {
                console.log('❌ Mensagem de erro detectada');
            }

            // Tenta novamente com Enter
            console.log('📍 Tentando com tecla Enter...');
            await page.click('input[type="password"]');
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 5000));

            console.log('📍 URL após Enter:', page.url());
            await page.screenshot({ path: '/tmp/login-v2-3-after-enter.png', fullPage: true });
        } else {
            console.log('✅ Login bem sucedido! URL:', currentUrl);

            // Navega para propostas
            console.log('📍 Indo para propostas...');
            await page.goto('https://comercial.monofloor.cloud/propostas', { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 3000));

            await page.screenshot({ path: '/tmp/login-v2-4-propostas.png', fullPage: true });
            console.log('📸 Screenshot: /tmp/login-v2-4-propostas.png');
            console.log('✅ Página de propostas carregada');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/login-v2-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');

})();
