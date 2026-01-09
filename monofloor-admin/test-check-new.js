const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Verificando nova proposta Marjorie_977d6a...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 1800 }
    });

    const page = await browser.newPage();

    try {
        // Acessa a nova proposta
        const url = 'https://propostas.monofloor.cloud/p/2026/Proposta_Marjorie_Lago_977d6a';
        console.log('📍 Acessando:', url);

        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        console.log('✅ Proposta carregada');

        // Screenshot primeira página
        await page.screenshot({ path: '/tmp/new-marjorie-1-first.png', fullPage: false });
        console.log('📸 /tmp/new-marjorie-1-first.png');

        // Vai para página de pagamento (onde fica o logo)
        console.log('📍 Indo para página de pagamento...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.95));
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: '/tmp/new-marjorie-2-payment.png', fullPage: false });
        console.log('📸 /tmp/new-marjorie-2-payment.png');

        // Última página
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: '/tmp/new-marjorie-3-last.png', fullPage: false });
        console.log('📸 /tmp/new-marjorie-3-last.png');

        console.log('✅ Screenshots capturados! Verifique se o logo está correto.');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    console.log('🏁 Teste concluído');
})();
