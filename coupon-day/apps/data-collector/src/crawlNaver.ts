import { chromium, Browser, Page, Frame } from 'playwright';
import { Item } from './normalize';

export async function crawlNaverMapMenu(storeName: string, address: string): Promise<Partial<Item>[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    const items: Partial<Item>[] = [];

    try {
        const query = `${address} ${storeName}`;
        console.log(`Searching Naver Map for: ${query}`);

        await page.goto('https://map.naver.com/v5/search', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Debug: Log all frames
        console.log('Frames found:', page.frames().map(f => f.name()));

        // Input search query
        const inputSelector = 'input.input_search';
        await page.waitForSelector(inputSelector, { timeout: 10000 });
        await page.fill(inputSelector, query);
        await page.keyboard.press('Enter');

        await page.waitForTimeout(3000);

        // Check frames
        let entryFrame: Frame | null = null;

        // Scenario 1: Search results list (searchIframe)
        const searchFrame = page.frame({ name: 'searchIframe' });
        if (searchFrame) {
            console.log('Search frame found.');
            // Wait for list to appear
            try {
                await searchFrame.waitForSelector('li', { timeout: 5000 });
                // Try clicking the first place link
                // The class logic is fragile. Let's try to click the first element that looks like a result.
                const firstResult = await searchFrame.$('li:first-child .place_bluelink');
                if (firstResult) {
                    console.log('Clicking first result...');
                    await firstResult.click();
                    await page.waitForTimeout(2000);
                } else {
                    console.log('No .place_bluelink found in first li.');
                }
            } catch (e) {
                console.log('No search results list found or timeout, checking entry frame directly.');
            }
        } else {
            console.log('Search frame NOT found.');
        }

        // Scenario 2: Direct Entry (entryIframe)
        // Retry logic
        for (let i = 0; i < 3; i++) {
            entryFrame = page.frame({ name: 'entryIframe' });
            if (entryFrame) break;
            console.log(`Waiting for entry frame... (${i + 1}/3)`);
            await page.waitForTimeout(2000);
        }

        if (entryFrame) {
            console.log('Entry frame found. Navigating to Menu.');

            try {
                // Determine if "Menu" tab exists
                // Use a broad text match for "메뉴" inside a link or span
                // Often it's <a ...><span>메뉴</span></a>
                const menuTab = await entryFrame.getByText('메뉴', { exact: true });
                if (await menuTab.isVisible()) {
                    console.log('Clicking Menu tab...');
                    await menuTab.click();
                } else {
                    console.log('Menu tab not immediately visible.');
                }

                await page.waitForTimeout(3000);

                // Extract Menu Items
                const extracted = await entryFrame.evaluate(() => {
                    const candidates = Array.from(document.querySelectorAll('ul > li'));
                    return candidates.map(li => (li as HTMLElement).innerText).filter((text: string) => text.includes('원') || /\d{3,}/.test(text));
                });

                console.log(`Extracted raw texts: ${extracted.length} items possibly.`);

                for (const text of extracted) {
                    const lines = text.split('\n');
                    if (lines.length >= 2) {
                        const name = lines[0];
                        const priceStr = lines.find((l: string) => l.includes('원') || /\d,?\d{3}/.test(l));
                        if (priceStr) {
                            const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
                            if (!isNaN(price) && price > 0) {
                                items.push({
                                    storeId: 'TBD',
                                    name: name.substring(0, 50),
                                    price: price,
                                    category: 'Main',
                                    isActive: true
                                });
                            }
                        }
                    }
                }

            } catch (error) {
                console.error('Error navigating/extracting menu:', error);
            }

        } else {
            console.error('Entry iframe not found. Navigation failed.');
            // Log final frames
            console.log('Final frames:', page.frames().map(f => f.name()));
        }

    } catch (error) {
        console.error('Crawler error:', error);
    } finally {
        await browser.close();
    }

    return items;
}

if (require.main === module) {
    crawlNaverMapMenu('김밥천국', '서울 강남구').then(items => {
        console.log('Crawled items:', items);
    });
}
