const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    let logs = '';
    page.on('console', msg => logs += 'PAGE LOG: ' + msg.text() + '\n');
    page.on('pageerror', error => logs += 'PAGE ERROR: ' + error.message + '\n');

    await page.goto('http://localhost:3000', { waitUntil: 'load' });

    // wait a bit
    await new Promise(r => setTimeout(r, 2000));
    fs.writeFileSync('test_logs.txt', logs);

    await browser.close();
})();
