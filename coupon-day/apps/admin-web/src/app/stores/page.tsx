import Link from 'next/link';
import { prisma } from '@/lib/db';

async function getStores() {
    const stores = await prisma.store.findMany({
        include: {
            _count: {
                select: { items: true },
            },
        },
        orderBy: { name: 'asc' },
        take: 50, // Pagination limit for prototype
    });
    return stores;
}

export default async function StoresPage() {
    const stores = await getStores();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Stores</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Manage your restaurant database.</p>
                </div>
                <button className="btn btn-primary">
                    Add New Store
                </button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Name</th>
                            <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Address</th>
                            <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Status</th>
                            <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Menu Items</th>
                            <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map((store) => {
                            const menuCount = store._count.items;
                            const status = menuCount > 0 ? 'Active' : 'Pending'; // Derived status

                            return (
                                <tr key={store.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{store.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-dim)' }}>{store.address}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            backgroundColor: status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: status === 'Active' ? 'var(--success)' : 'var(--error)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '99px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{menuCount}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/stores/${store.id}`} className="btn" style={{ fontSize: '0.9rem', color: 'var(--primary)', padding: 0 }}>
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {stores.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                    No stores found in database. Run the data collector first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
