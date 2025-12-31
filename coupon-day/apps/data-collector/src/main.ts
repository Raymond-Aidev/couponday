import { fetchPublicData } from './fetchPublicData';
import { normalizePublicData } from './normalize';
import { importData } from './import';
import { crawlNaverMapMenu } from './crawlNaver';

async function main() {
    // 1. Fetch
    console.log('Step 1: Fetching Data...');
    let rawData = await fetchPublicData();

    if (!rawData || rawData.length === 0) {
        console.log('No data fetched. Exiting.');
        return;
    }

    // 2. Normalize Store Info
    console.log('Step 2: Normalizing Data...');
    const normalized = normalizePublicData(rawData);
    console.log(`Normalized ${normalized.length} entries.`);

    // 3. Crawl Menus (Hybrid Strategy)
    console.log('Step 3: Crawling Menus from Naver Map...');
    // Process sequentially to avoid Playwright resource issues
    for (const entry of normalized) {
        if (entry.store.name && entry.store.address) {
            try {
                console.log(`Processing [${entry.store.name}]...`);
                // Use Name + Address for search.
                // Could refine to Name + District if Address is too long/duplicate.
                const crawledItems = await crawlNaverMapMenu(entry.store.name, entry.store.address);
                if (crawledItems.length > 0) {
                    entry.items = crawledItems;
                    console.log(`  -> Found ${crawledItems.length} menu items.`);
                } else {
                    console.log('  -> No menu items found via crawler.');
                }
            } catch (e) {
                console.error(`  -> Failed to crawl ${entry.store.name}:`, e);
            }
        }
    }

    // 4. Import
    console.log('Step 4: Importing to DB (Dry Run)...');
    await importData(normalized);

    console.log('Dry Run Complete. Final Data Sample:', JSON.stringify(normalized, null, 2));
}

if (require.main === module) {
    main();
}
