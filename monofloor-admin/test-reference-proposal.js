const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Teste de proposta de referência (Fernando)...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 1800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    try {
        // Acessa proposta de referência (Fernando - a que funcionava)
        const referenceUrl = 'https://propostas.monofloor.cloud/p/2026/Proposta_Fernando_888637';
        console.log('📍 Acessando proposta de referência:', referenceUrl);

        await page.goto(referenceUrl, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        console.log('✅ Proposta carregada');

        // Screenshot da primeira página
        await page.screenshot({ path: '/tmp/ref-1-first.png', fullPage: false });
        console.log('📸 /tmp/ref-1-first.png');

        // Pega informações da proposta
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                pageCount: document.querySelectorAll('[class*="page"], .slide, section').length,
                hasLogo: !!document.querySelector('img[src*="logo"], img[alt*="logo"], img[alt*="monofloor"]'),
                bodyText: document.body.innerText.substring(0, 500)
            };
        });
        console.log('📄 Info:', JSON.stringify(pageInfo, null, 2));

        // Scroll para páginas 24, 25, 26
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        console.log('📄 Altura total:', pageHeight);

        // Página 24 (~85%)
        console.log('📍 Indo para página 24...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.85));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/ref-2-page24.png', fullPage: false });
        console.log('📸 /tmp/ref-2-page24.png');

        // Página 25 (~92%)
        console.log('📍 Indo para página 25...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.92));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/ref-3-page25.png', fullPage: false });
        console.log('📸 /tmp/ref-3-page25.png');

        // Página 26 (~97%)
        console.log('📍 Indo para página 26...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.97));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/ref-4-page26.png', fullPage: false });
        console.log('📸 /tmp/ref-4-page26.png');

        // Última página
        console.log('📍 Indo para última página...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/ref-5-last.png', fullPage: false });
        console.log('📸 /tmp/ref-5-last.png');

        console.log('✅ Proposta de REFERÊNCIA capturada!');

        // Agora acessa a proposta mais recente (Marjorie - a que tinha problema)
        console.log('\n📍 Agora acessando proposta RECENTE (Marjorie)...');
        const recentUrl = 'https://propostas.monofloor.cloud/p/2026/Proposta_Marjorie_Lago_4707d7';

        await page.goto(recentUrl, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        console.log('✅ Proposta recente carregada');

        // Screenshot da primeira página
        await page.screenshot({ path: '/tmp/recent-1-first.png', fullPage: false });
        console.log('📸 /tmp/recent-1-first.png');

        // Página 24
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.85));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/recent-2-page24.png', fullPage: false });
        console.log('📸 /tmp/recent-2-page24.png');

        // Página 25
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.92));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/recent-3-page25.png', fullPage: false });
        console.log('📸 /tmp/recent-3-page25.png');

        // Página 26
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.97));
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '/tmp/recent-4-page26.png', fullPage: false });
        console.log('📸 /tmp/recent-4-page26.png');

        console.log('✅ Proposta RECENTE capturada!');
        console.log('\n🔍 Compare os screenshots:');
        console.log('   REFERÊNCIA: /tmp/ref-*.png');
        console.log('   RECENTE: /tmp/recent-*.png');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        await page.screenshot({ path: '/tmp/ref-error.png', fullPage: true });
    }

    console.log('🏁 Teste concluído');
})();
