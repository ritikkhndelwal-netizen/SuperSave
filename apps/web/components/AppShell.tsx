'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  ['Dashboard', '/dashboard', '⌂'],
  ['Saved', '/dashboard', '▣'],
  ['Collections', '/dashboard', '▤'],
  ['Favorites', '/dashboard', '♡'],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">R</span>
          <span>ReelMind</span>
        </Link>
        <div className="sidebar-section-label">LIBRARY</div>
        <nav className="nav-list">
          {nav.map(([label, href, icon]) => (
            <Link key={label} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="extension-card">
            <div className="extension-icon">⌘</div>
            <div>
              <strong>Save in one click</strong>
              <p>Install the browser extension.</p>
            </div>
          </div>
          <div className="profile-row">
            <div className="avatar">RK</div>
            <div>
              <strong>Demo User</strong>
              <span>demo@reelmind.app</span>
            </div>
            <span className="dots">•••</span>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
