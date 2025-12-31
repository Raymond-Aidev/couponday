import Link from 'next/link';
import styles from './Sidebar.module.css'; // Optional module usage if requested, using globals for now based on file content

const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Stores', href: '/stores' },
    { label: 'Menu Management', href: '/menus' },
    { label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    return (
        <aside className="sidebar">
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    CouponDay Admin
                </h2>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-dim)',
                            fontWeight: 500,
                        }}
                        // Add hover effect via CSS modules normally, inline for simplicity here or add class
                        className="nav-item"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    v1.0.0
                </span>
            </div>
        </aside>
    );
}
