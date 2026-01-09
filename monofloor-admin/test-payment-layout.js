const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Testando novo layout de pagamento...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 1800 }
    });

    const page = await browser.newPage();

    try {
        // Acessa uma proposta recente
        const url = 'https://propostas.monofloor.cloud/p/2026/Proposta_Marjorie_Lago_227b86';
        console.log('📍 Acessando:', url);

        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 3000));

        // Navega até a página de pagamento (geralmente é uma das últimas páginas)
        // Vamos scrollar até encontrar
        console.log('📍 Procurando página de pagamento...');

        // Vai para a página de pagamento diretamente via scroll
        for (let i = 0; i < 25; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(r => setTimeout(r, 300));
        }

        await new Promise(r => setTimeout(r, 2000));

        // Screenshot da página de pagamento
        await page.screenshot({ path: '/tmp/payment-layout-new.png', fullPage: false });
        console.log('📸 /tmp/payment-layout-new.png');

        console.log('✅ Verifique se o layout usa fonte Widescreen e tem o novo design!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    console.log('🏁 Teste concluído');
})();
