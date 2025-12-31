import { PrismaClient } from '@prisma/client';
import { NormalizedData } from './normalize';

const prisma = new PrismaClient();

export async function importData(data: NormalizedData[]) {
    console.log(`Importing ${data.length} stores to DB...`);

    // Ensure a default category exists
    let defaultCategory = await prisma.storeCategory.findFirst({
        where: { name: 'General' }
    });

    if (!defaultCategory) {
        console.log('Creating default category: General');
        defaultCategory = await prisma.storeCategory.create({
            data: {
                name: 'General',
                displayOrder: 1
            }
        });
    }

    for (const entry of data) {
        const { store, items } = entry;
        // Skip if essential info missing
        if (!store.name || !store.address) continue;

        try {
            const existing = await prisma.store.findFirst({
                where: {
                    name: store.name,
                    address: store.address
                }
            });

            let storeId = existing?.id;

            if (!existing) {
                // "BusinessNumber" is required and unique in schema. Public data might not have it.
                // We'll generate a dummy one for the prototype or hash the name+address.
                const dummyBizNum = 'TEMP-' + Math.random().toString(36).substr(2, 9).toUpperCase();

                const created = await prisma.store.create({
                    data: {
                        name: store.name,
                        address: store.address,
                        // Handle required businessNumber
                        businessNumber: dummyBizNum,
                        // Handle required categoryId
                        categoryId: defaultCategory.id,

                        phone: store.phone || null,
                        // Ensure lat/long are not undefined. 
                        latitude: store.latitude || 0,
                        longitude: store.longitude || 0,

                        description: '',
                        coverImageUrl: null
                    }
                });
                storeId = created.id;
                console.log(`Created store: ${store.name}`);
            } else {
                // console.log(`Store exists: ${store.name}`);
                storeId = existing.id;
            }

            if (storeId && items && items.length > 0) {
                for (const item of items) {
                    if (!item.name || !item.price) continue;

                    // Item schema required fields: storeId, name, price
                    // Optional: description, imageUrl, category(String?), marginRate, etc.
                    // Boolean: isAvailable (default true)

                    const existingItem = await prisma.item.findFirst({
                        where: {
                            storeId: storeId,
                            name: item.name
                        }
                    });

                    if (!existingItem) {
                        await prisma.item.create({
                            data: {
                                storeId: storeId,
                                name: item.name,
                                price: item.price,
                                // Map category string from crawler to Item.category (which is String?)
                                // Schema: category String?
                                category: item.category || 'Main',
                                description: item.description || null,
                                imageUrl: item.imageUrl || null,
                                // Map isActive to isAvailable
                                isAvailable: item.isActive ?? true
                            }
                        });
                    }
                }
                console.log(`  -> Added ${items.length} items to ${store.name}`);
            }

        } catch (e) {
            console.error(`Failed to import ${store.name}:`, e);
        }
    }
}
