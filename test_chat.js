const puppeteer = require('puppeteer');

(async () => {
    let result = '';
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('http://localhost:3000', { waitUntil: 'load' });

    // click Enter Chat
    await page.waitForSelector('#btn-login');
    await page.click('#btn-login');

    // wait for chat app to show
    await page.waitForSelector('#chat-input', { visible: true });

    // wait for connection log (User connected should show socket.io connection in terminal, but let's wait a bit)
    await new Promise(r => setTimeout(r, 1000));

    // type a good message
    await page.type('#chat-input', 'Hello everyone! I love Java.');
    await page.keyboard.press('Enter');

    // type a bad message
    await page.type('#chat-input', 'This is spam idiot!');
    await page.keyboard.press('Enter');

    await new Promise(r => setTimeout(r, 4000));

    const messages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.msg-node p')).map(el => el.textContent);
    });

    const warning = await page.evaluate(() => {
        const warn = document.querySelector('#warning-reason');
        return warn ? warn.textContent : null;
    });

    console.log("MESSAGES ON SCREEN:", messages);
    console.log("WARNING ON SCREEN:", warning);

    await browser.close();
})();
