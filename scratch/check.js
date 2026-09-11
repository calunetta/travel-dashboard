const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bypassAuth', 'true');
  });
  await page.goto('http://localhost:4200/admin/trips', { waitUntil: 'networkidle2' });
  await browser.close();
})();
