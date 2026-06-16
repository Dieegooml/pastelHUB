import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message, err.stack?.split('\n').slice(0,3).join('\n')));
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const hasError = html.includes('Algo sali');
    console.log('Has ErrorBoundary:', hasError);
    if (hasError) {
      const text = await page.textContent('body');
      console.log('Body text:', text.substring(0, 500));
    } else {
      console.log('Page rendered OK');
    }
  } catch (e) {
    console.log('NAV_ERROR:', e.message);
  }
  await browser.close();
})();
