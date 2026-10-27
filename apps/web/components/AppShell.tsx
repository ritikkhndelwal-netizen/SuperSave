import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

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
  const router = useRouter();
  const { user, displayName, displayEmail, avatarInitials, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

          <div
            className="profile-row"
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar">{avatarInitials}</div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {displayName}
              </strong>
              <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {displayEmail}
              </span>
            </div>
            <span className="dots" title="Account settings">•••</span>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: '8px',
                  background: '#18181b',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  zIndex: 50,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {user ? (
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await signOut();
                      router.push('/login');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: '8px',
                    }}
                  >
                    Log out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setShowProfileMenu(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      color: '#a855f7',
                      fontSize: '13px',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Log in / Sign up →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
