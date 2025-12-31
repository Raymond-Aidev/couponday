import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


async function getStats() {
    const totalStores = await prisma.store.count();
    const totalMenus = await prisma.item.count();

    // Placeholder: "Crawled Today" logic would go here.
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // const crawledToday = await prisma.item.count({ where: { createdAt: { gte: today } } });

    const crawledToday = 0;

    return { totalStores, totalMenus, crawledToday };
}

export default async function Home() {
    const stats = await getStats();

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-dim)' }}>Overview of coupon-day data collection.</p>
            </div>

            <div className="grid-cols-3">
                <div className="card">
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Stores</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalStores}</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Menu Items</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalMenus.toLocaleString()}</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Crawled Today</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>+{stats.crawledToday}</p>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
                    <p style={{ color: 'var(--text-dim)' }}>Real-time activity feed coming soon.</p>
                </div>
            </div>
        </div>
    );
}
