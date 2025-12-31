// import { Store, Item } from '@coupon-day/shared-types';

// Standalone type definitions for prototype
import { PublicPlaceInfo } from './fetchPublicData';

export interface Store {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
}

export interface Item {
    storeId: string;
    name: string;
    price: number;
    category: string;
    description?: string;
    imageUrl?: string | null;
    isActive: boolean;
}

export interface NormalizedData {
    store: Partial<Store>;
    items: Partial<Item>[];
}

export function normalizePublicData(rawData: PublicPlaceInfo[]): NormalizedData[] {
    return rawData.map(row => {
        // 1. Normalize Store
        const store: Partial<Store> = {
            name: row.UPSO_NM,
            address: row.RDN_CODE_NM,
            phone: row.TEL_NO,
            latitude: parseFloat(row.Y_DNTS) || null as any,
            longitude: parseFloat(row.X_CNTS) || null as any,
        };

        // 2. Normalize Items (Menu)
        const items: Partial<Item>[] = [];
        if (row.FOOD_MENU) {
            const menuItems = row.FOOD_MENU.split(',').map(s => s.trim());
            menuItems.forEach(menuStr => {
                // Very basic parser: "Name Price" or "Name"
                // Regex to separate price if digits exist at end
                const match = menuStr.match(/^(.*?)\s*(\d+)$/);
                if (match) {
                    items.push({
                        name: match[1].trim(),
                        price: parseInt(match[2], 10),
                        category: 'Main',
                    });
                } else {
                    items.push({
                        name: menuStr,
                        price: 0,
                        category: 'Main',
                    });
                }
            });
        }

        return { store, items };
    });
}
