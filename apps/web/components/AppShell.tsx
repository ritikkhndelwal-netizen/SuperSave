'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  id: 'dashboard' | 'saved' | 'collections' | 'favorites';
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard?tab=dashboard', icon: '⌂' },
  { id: 'saved', label: 'Saved', href: '/dashboard?tab=saved', icon: '▣' },
  { id: 'collections', label: 'Collections', href: '/dashboard?tab=collections', icon: '▤' },
  { id: 'favorites', label: 'Favorites', href: '/dashboard?tab=favorites', icon: '♡' },
];

export function AppShell({
  children,
  activeTab,
  onTabChange,
}: {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: 'dashboard' | 'saved' | 'collections' | 'favorites') => void;
}) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          href="/dashboard"
          className="brand"
          onClick={(e) => {
            if (onTabChange) {
              e.preventDefault();
              onTabChange('dashboard');
            }
          }}
        >
          <span className="brand-mark">S</span>
          <span>SuperSave</span>
        </Link>

        <div className="sidebar-section-label">LIBRARY</div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const isActive = activeTab
              ? activeTab === item.id
              : pathname === '/dashboard' && item.id === 'dashboard';

            if (onTabChange) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{ background: 'transparent', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="extension-card">
            <div className="extension-icon">⌘</div>
            <div>
              <strong>Save in one click</strong>
              <p>Install Chrome extension or paste any URL.</p>
            </div>
          </div>
          <div className="profile-row">
            <div className="avatar">RK</div>
            <div>
              <strong>Demo User</strong>
              <span>demo@supersave.app</span>
            </div>
            <span className="dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
