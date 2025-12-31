import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function main() {
    console.log('Checking DB connection...');
    console.log('URL:', process.env.DATABASE_URL);
    try {
        const storeCount = await prisma.store.count();
        console.log('Store Count:', storeCount);
        const stores = await prisma.store.findMany({ take: 1 });
        console.log('Sample Store:', stores[0]);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
