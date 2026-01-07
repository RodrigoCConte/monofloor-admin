const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Go to the comercial page
  await page.goto('http://localhost:5174/comercial');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Look for a deal with recordings - click on one
  console.log('Page loaded, looking for deals...');

  // Get page content to understand structure
  const content = await page.content();
  console.log('Page has content, length:', content.length);

  // Take screenshot
  await page.screenshot({ path: '/tmp/replay-inspect-1.png', fullPage: true });
  console.log('Screenshot 1 saved');

  // Try to find and click a recording play button
  // First, we need to click on a deal to open the side panel
  const dealCard = await page.$('.deal-card');
  if (dealCard) {
    await dealCard.click();
    console.log('Clicked on deal card');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/replay-inspect-2.png', fullPage: true });
  }

  // Look for play recording button in the analytics views
  const playBtn = await page.$('[class*="play"]');
  if (playBtn) {
    console.log('Found play button');
  }

  // Check the rrweb-player structure when modal is open
  const rrwebPlayer = await page.$('#rrweb-player');
  if (rrwebPlayer) {
    const html = await rrwebPlayer.innerHTML();
    console.log('rrweb-player HTML:', html.substring(0, 500));

    // Get computed styles
    const styles = await page.evaluate(() => {
      const el = document.querySelector('#rrweb-player');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        overflow: computed.overflow,
        position: computed.position
      };
    });
    console.log('rrweb-player styles:', styles);

    // Check replayer-wrapper
    const wrapperStyles = await page.evaluate(() => {
      const el = document.querySelector('.replayer-wrapper');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        width: computed.width,
        height: computed.height,
        transform: computed.transform,
        boundingRect: rect
      };
    });
    console.log('replayer-wrapper styles:', wrapperStyles);

    // Check iframe inside
    const iframeStyles = await page.evaluate(() => {
      const el = document.querySelector('.replayer-wrapper iframe');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        width: computed.width,
        height: computed.height,
        transform: computed.transform,
        boundingRect: rect
      };
    });
    console.log('iframe styles:', iframeStyles);
  }

  console.log('\nKeeping browser open for manual inspection...');
  console.log('Press Ctrl+C to close');

  // Keep browser open
  await page.waitForTimeout(300000);

  await browser.close();
})();
