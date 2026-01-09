const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Iniciando debug do console...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    // Captura TODOS os logs do console
    page.on('console', msg => {
        const type = msg.type().toUpperCase();
        console.log('[' + type + ']', msg.text());
    });

    // Captura erros de página
    page.on('pageerror', error => {
        console.log('❌ PAGE ERROR:', error.message);
    });

    // Captura erros de request
    page.on('requestfailed', request => {
        console.log('❌ REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    try {
        console.log('📍 Acessando login...');
        await page.goto('https://comercial.monofloor.cloud/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Aguarda e captura erros
        await new Promise(r => setTimeout(r, 5000));

        // Screenshot
        await page.screenshot({ path: '/tmp/debug-login.png', fullPage: true });
        console.log('📸 Screenshot: /tmp/debug-login.png');

        // Verifica conteúdo da página
        const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
        console.log('📄 Body HTML (primeiros 2000 chars):', bodyHTML);

        // Verifica se há erro no DOM
        const hasError = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .error-message');
            return Array.from(errorElements).map(e => e.textContent.trim()).filter(t => t.length > 0);
        });

        if (hasError.length > 0) {
            console.log('❌ Erros no DOM:', hasError);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    console.log('🏁 Debug concluído');

})();
