import Link from 'next/link';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

async function getStore(id: string) {
  // Try to parse id as UUID (Store ID) or handling integer if legacy mock persisted (unlikely with DB)
  // Our schema usually uses UUID for Store ID. 
  // If parsing fails or store not found, return null.

  try {
    const store = await prisma.store.findUnique({
      where: { id: id },
      include: {
        items: {
          orderBy: { price: 'asc' }
        }
      }
    });
    return store;
  } catch (e) {
    return null;
  }
}

export default async function StoreDetailPage({ params }: { params: { id: string } }) {
  const store = await getStore(params.id);

  if (!store) {
    notFound();
  }

  const menuCount = store.items.length;
  const status = menuCount > 0 ? 'Active' : 'Pending';

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/stores" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem', display: 'inline-block' }}>
          &larr; Back to Stores
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{store.name}</h1>
            <p style={{ color: 'var(--text-dim)' }}>{store.address}</p>
          </div>
          <button className="btn btn-primary">
            Sync Menu Data
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Basic Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Status</span>
            <span style={{ fontWeight: 500 }}>{status}</span>
          </div>
          <div>
            <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Phone</span>
            <span style={{ fontWeight: 500 }}>{store.phone || '-'}</span>
          </div>
          <div>
            <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Coordinates</span>
            <span style={{ fontWeight: 500 }}>{store.latitude}, {store.longitude}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Menu Items</h3>
        <div className="card">
          {store.items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-dim)' }}>Image</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-dim)' }}>Name</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-dim)' }}>Price</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-dim)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {store.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ width: 48, height: 48, backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.7rem' }}>No Img</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '0.75rem' }}>{item.price.toLocaleString()} KRW</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No menu items found. Click 'Sync Menu Data' to crawl.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
