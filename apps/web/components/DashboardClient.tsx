'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_USER_COLLECTIONS, generateAutoCollections } from '../lib/collections';
import type { Collection, SavedContent } from '../lib/types';
import { AppShell } from './AppShell';
import { CardActionMenu } from './CardActionMenu';
import { EditContentModal } from './EditContentModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useAuth } from '../lib/auth-context';
import { useCredits } from '../lib/credits-context';
import { apiFetch } from '../lib/api';

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-thumb shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line shimmer" style={{ width: '35%', height: '11px' }} />
        <div className="skeleton-line shimmer" style={{ width: '85%', height: '17px', margin: '4px 0' }} />
        <div className="skeleton-line shimmer" style={{ width: '100%', height: '13px' }} />
        <div className="skeleton-line shimmer" style={{ width: '65%', height: '13px' }} />
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <div className="skeleton-line shimmer" style={{ width: '48px', height: '16px', borderRadius: '999px' }} />
          <div className="skeleton-line shimmer" style={{ width: '58px', height: '16px', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="content-grid" aria-label="Loading library items...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function getCardThumbnailBg(thumbnail?: string, source?: string) {
  if (thumbnail) {
    return `linear-gradient(180deg, rgba(13,7,20,.1), rgba(13,7,20,.85)), url(${thumbnail})`;
  }
  if (source === 'Instagram') {
    return `radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)`;
  }
  if (source === 'Pinterest') {
    return `linear-gradient(135deg, #e60023, #ad081b)`;
  }
  if (source === 'YouTube') {
    return `linear-gradient(135deg, #c4302b, #8b1814)`;
  }
  return undefined;
}

export function DashboardClient({ items: initialItems }: { items: SavedContent[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, displayName } = useAuth();
  const { credits, refreshCredits, setShowCreditsModal } = useCredits();

  // Auth gate: Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Navigation tab state: 'dashboard' | 'saved' | 'collections' | 'favorites'
  const [activeNavTab, setActiveNavTab] = useState<'dashboard' | 'saved' | 'collections' | 'favorites'>('dashboard');

  // Core items & loading states
  const [items, setItems] = useState<SavedContent[]>(initialItems);
  const [isLoading, setIsLoading] = useState<boolean>(() => initialItems.length === 0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const pollCountRef = useRef(0);

  // Search & Categories
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [searchMode, setSearchMode] = useState<'library' | 'web'>('library');

  // Quick Capture modal state
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [extractionMode, setExtractionMode] = useState<'video_lowres' | 'audio_fast'>('video_lowres');

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Automatic Collections state & toggle
  const [autoCollectionsEnabled, setAutoCollectionsEnabled] = useState<boolean>(true);
  const [autoToggleToast, setAutoToggleToast] = useState<string | null>(null);

  // Custom User Collections
  const [userCollections, setUserCollections] = useState<Collection[]>(DEFAULT_USER_COLLECTIONS);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'ai' | 'custom'>('all');

  // Create Collection Modal
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollTitle, setNewCollTitle] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  const [newCollIcon, setNewCollIcon] = useState('📁');
  const [newCollSelectedItems, setNewCollSelectedItems] = useState<string[]>([]);

  // Saved Tab Specific State
  const [savedSourceFilter, setSavedSourceFilter] = useState<'All' | 'YouTube' | 'Instagram' | 'Web' | 'Upload'>('All');
  const [savedSort, setSavedSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [savedViewMode, setSavedViewMode] = useState<'grid' | 'list'>('grid');

  // Card Actions & Modals State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SavedContent | null>(null);
  const [deletingItem, setDeletingItem] = useState<SavedContent | null>(null);

  // Close card menu on document click or Escape
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openMenuId) setOpenMenuId(null);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  // Sync tab with URL query parameter on mount and when query changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'saved' || tabParam === 'collections' || tabParam === 'favorites' || tabParam === 'dashboard') {
      setActiveNavTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'dashboard' | 'saved' | 'collections' | 'favorites') => {
    setActiveNavTab(tab);
    setSelectedCollectionId(null);
    const newUrl = tab === 'dashboard' ? '/dashboard' : `/dashboard?tab=${tab}`;
    window.history.pushState(null, '', newUrl);
  };

  // Load preferences and cached items from localStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('supersave_cached_items');
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setIsLoading(false);
        }
      }

      const savedMode = localStorage.getItem('supersave_extraction_mode');
      if (savedMode === 'audio_fast' || savedMode === 'video_lowres') {
        setExtractionMode(savedMode);
      }

      const savedFavs = localStorage.getItem('supersave_favorites');
      if (savedFavs) {
        setFavorites(new Set(JSON.parse(savedFavs)));
      }

      const savedAutoEnabled = localStorage.getItem('supersave_auto_collections_enabled');
      if (savedAutoEnabled !== null) {
        setAutoCollectionsEnabled(savedAutoEnabled === 'true');
      }

      const savedUserColls = localStorage.getItem('supersave_user_collections');
      if (savedUserColls) {
        setUserCollections(JSON.parse(savedUserColls));
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const handleModeChange = (mode: 'video_lowres' | 'audio_fast') => {
    setExtractionMode(mode);
    try {
      localStorage.setItem('supersave_extraction_mode', mode);
    } catch {}
  };

  // Favorite toggle handler
  const handleToggleFavorite = (itemId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem('supersave_favorites', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Card Action triggers
  const handleStartEdit = (item: SavedContent) => {
    setEditingItem(item);
  };

  const handleStartDelete = (item: SavedContent) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      const response = await apiFetch(`/api/content/${deletingItem.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      const deletedId = deletingItem.id;

      // Optimistically remove from state and cache
      setItems((current) => {
        const next = current.filter((it) => it.id !== deletedId);
        try {
          localStorage.setItem('supersave_cached_items', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Remove from favorites
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        try {
          localStorage.setItem('supersave_favorites', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });

      // Remove from user collections
      setUserCollections((prev) => {
        const next = prev.map((c) => ({
          ...c,
          itemIds: c.itemIds.filter((id) => id !== deletedId),
        }));
        try {
          localStorage.setItem('supersave_user_collections', JSON.stringify(next));
        } catch {}
        return next;
      });

      setDeletingItem(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete card. Please ensure the backend is running.');
    }
  };

  // Auto-Collections Toggle
  const handleToggleAutoCollections = () => {
    const nextState = !autoCollectionsEnabled;
    setAutoCollectionsEnabled(nextState);
    try {
      localStorage.setItem('supersave_auto_collections_enabled', String(nextState));
    } catch {}
    const msg = nextState
      ? '⚡ Auto-Collections Enabled: Gemini automatically clusters your notes by topics & tags.'
      : 'Auto-Collections Paused: Showing only your custom collections.';
    setAutoToggleToast(msg);
    setTimeout(() => setAutoToggleToast(null), 3500);
  };

  // Compute Auto-Collections
  const autoCollections = useMemo(() => {
    if (!autoCollectionsEnabled) return [];
    return generateAutoCollections(items);
  }, [items, autoCollectionsEnabled]);

  // Combine All Collections
  const allCollections = useMemo(() => {
    return [...userCollections, ...autoCollections];
  }, [userCollections, autoCollections]);

  // Active Collection for drill-down view
  const activeCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return allCollections.find((c) => c.id === selectedCollectionId) || null;
  }, [selectedCollectionId, allCollections]);

  // Initial fetch from API (Authenticated background revalidation)
  useEffect(() => {
    let isCancelled = false;
    setIsSyncing(true);

    apiFetch('/api/content')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items: SavedContent[] }) => {
        if (isCancelled) return;
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
          try {
            localStorage.setItem('supersave_cached_items', JSON.stringify(data.items));
          } catch {}
        }
      })
      .catch(() => {
        setItems((curr) => (curr.length === 0 ? initialItems : curr));
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Polling mechanism: If any item is in 'processing' status, poll every 4s (capped to 12 attempts)
  useEffect(() => {
    const hasProcessing = items.some((item) => item.status === 'processing');
    if (!hasProcessing) {
      pollCountRef.current = 0;
      return;
    }

    if (pollCountRef.current >= 12) {
      return;
    }

    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      pollCountRef.current += 1;
      if (pollCountRef.current > 12) {
        clearInterval(interval);
        return;
      }

      apiFetch('/api/content')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { items: SavedContent[] }) => {
          if (data && Array.isArray(data.items)) {
            setItems((prev) => {
              const prevStatus = prev.map((i) => `${i.id}:${i.status}`).join(',');
              const newStatus = data.items.map((i) => `${i.id}:${i.status}`).join(',');
              if (prevStatus !== newStatus || prev.length !== data.items.length) {
                try {
                  localStorage.setItem('supersave_cached_items', JSON.stringify(data.items));
                } catch {}
                return data.items;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [items]);

  async function saveUrl() {
    if (!url.trim()) return;
    if (credits && credits.remaining <= 0) {
      setMessage(`Monthly credit limit reached (${credits.used}/${credits.limit}). Resets in ${credits.daysLeft} days.`);
      return;
    }
    setMessage('Capturing metadata & starting Gemini multimodal analysis…');
    try {
      const response = await apiFetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), mode: extractionMode }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const errData = await response.json().catch(() => ({}));
          setMessage(errData.error || 'Monthly AI credit limit reached.');
          await refreshCredits();
          return;
        }
        throw new Error('Unable to save');
      }
      const data = await response.json();
      refreshCredits();

      setItems((current) => {
        const next = [
          {
            ...data.item,
            savedAt: 'Just now',
            status: 'processing',
          },
          ...current.filter((i) => i.id !== data.item.id),
        ];
        try {
          localStorage.setItem('supersave_cached_items', JSON.stringify(next));
        } catch {}
        return next;
      });
      pollCountRef.current = 0;

      setMessage(
        extractionMode === 'audio_fast'
          ? 'Saved! Audio extracted & Gemini analyzing…'
          : 'Saved! 480p video stream downloaded & Gemini analyzing…'
      );
      setUrl('');
      setTimeout(() => setShowAdd(false), 1200);
    } catch {
      setMessage('Captured locally for demo. Connect the API to process live.');
    }
  }

  // Create Custom Collection Handler
  const handleCreateCustomCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollTitle.trim()) return;

    const newColl: Collection = {
      id: `custom-${Date.now()}`,
      title: newCollTitle.trim(),
      description: newCollDesc.trim() || 'Custom curated knowledge vault.',
      icon: newCollIcon.trim() || '📁',
      isAutoGenerated: false,
      itemIds: newCollSelectedItems,
      createdAt: 'Custom Vault',
      color: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    };

    const updated = [newColl, ...userCollections];
    setUserCollections(updated);
    try {
      localStorage.setItem('supersave_user_collections', JSON.stringify(updated));
    } catch {}

    setNewCollTitle('');
    setNewCollDesc('');
    setNewCollIcon('📁');
    setNewCollSelectedItems([]);
    setShowCreateCollection(false);
  };

  const handleDeleteCustomCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this custom collection?')) {
      const updated = userCollections.filter((c) => c.id !== id);
      setUserCollections(updated);
      try {
        localStorage.setItem('supersave_user_collections', JSON.stringify(updated));
      } catch {}
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
      }
    }
  };

  // Categories list
  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];

  // Filtered items for Dashboard tab
  const dashboardFiltered = useMemo(() => {
    return items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.notes} ${(item.tags || []).join(' ')}`.toLowerCase();
      const matchText = haystack.includes(query.toLowerCase());
      const matchCategory = category === 'All' || item.category === category;
      return matchText && matchCategory;
    });
  }, [items, query, category]);

  // Filtered & Sorted items for Saved tab
  const savedFiltered = useMemo(() => {
    let result = items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.notes} ${(item.tags || []).join(' ')}`.toLowerCase();
      const matchText = haystack.includes(query.toLowerCase());
      const matchSource = savedSourceFilter === 'All' || item.source === savedSourceFilter;
      return matchText && matchSource;
    });

    if (savedSort === 'newest') {
      result = [...result];
    } else if (savedSort === 'oldest') {
      result = [...result].reverse();
    } else if (savedSort === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [items, query, savedSourceFilter, savedSort]);

  // Filtered items for Favorites tab
  const favoritesFiltered = useMemo(() => {
    return items
      .filter((item) => favorites.has(item.id))
      .filter((item) => {
        const haystack = `${item.title} ${item.summary} ${item.notes} ${(item.tags || []).join(' ')}`.toLowerCase();
        const matchText = haystack.includes(query.toLowerCase());
        const matchCategory = category === 'All' || item.category === category;
        return matchText && matchCategory;
      });
  }, [items, favorites, query, category]);

  // Filtered collections for Collections tab
  const displayedCollections = useMemo(() => {
    if (collectionFilter === 'ai') {
      return allCollections.filter((c) => c.isAutoGenerated);
    }
    if (collectionFilter === 'custom') {
      return allCollections.filter((c) => !c.isAutoGenerated);
    }
    return allCollections;
  }, [allCollections, collectionFilter]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#09070f', color: '#ba82ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px', background: 'linear-gradient(135deg, #ba82ff, #7444d7)', display: 'grid', placeItems: 'center', fontSize: 24, boxShadow: '0 8px 24px rgba(135, 82, 233, 0.4)' }}>
            ⚡
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#a69cb0', letterSpacing: '-0.01em' }}>Opening your knowledge vault…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      activeTab={activeNavTab}
      onTabChange={handleTabChange}
      onSaveClick={() => setShowAdd(true)}
    >
      {/* Toast Notification for Auto-Collections Toggle */}
      {autoToggleToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 28,
            zIndex: 100,
            background: 'linear-gradient(135deg, #25163f, #140e24)',
            border: '1px solid #7c48cf',
            color: '#f4edff',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <span>{autoToggleToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeNavTab === 'dashboard' && (
        <>
          <header className="topbar">
            <div>
              <div className="eyebrow">YOUR KNOWLEDGE HUB</div>
              <h1>{timeGreeting}, {displayName}.</h1>
              <p className="muted">Turn the things you save into things you remember.</p>
            </div>
            <button className="primary-button" onClick={() => setShowAdd(true)}>
              + Save content
            </button>
          </header>

          <section className="hero-stat-grid">
            <div className="stat-card accent">
              <span>Saved content</span>
              <strong>{items.length}</strong>
              <small>Across your library</small>
            </div>
            <div className="stat-card">
              <span>AI notes</span>
              <strong>{items.filter((i) => i.status !== 'processing').length}</strong>
              <small>Multimodal intelligence ready</small>
            </div>
            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleTabChange('collections')}
              title="Click to view all collections"
            >
              <span>Collections</span>
              <strong>{allCollections.length}</strong>
              <small style={{ color: '#c084fc' }}>
                {autoCollectionsEnabled ? '⚡ Auto-grouped with AI' : 'Manual vaults'} →
              </small>
            </div>
          </section>

          {/* Featured Collections Preview */}
          {allCollections.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <div className="section-head" style={{ marginTop: '0', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '16px' }}>Knowledge Collections</h2>
                  <span>Curated topic vaults</span>
                </div>
                <button className="text-button" onClick={() => handleTabChange('collections')}>
                  View all collections ({allCollections.length}) →
                </button>
              </div>

              <div className="featured-collections-row">
                {allCollections.slice(0, 3).map((coll) => (
                  <div
                    key={coll.id}
                    className="featured-collection-mini"
                    onClick={() => {
                      setSelectedCollectionId(coll.id);
                      handleTabChange('collections');
                    }}
                  >
                    <div className="mini-icon">{coll.icon}</div>
                    <div className="mini-details">
                      <h4>{coll.title}</h4>
                      <span>
                        {coll.itemIds.length} saved note{coll.itemIds.length === 1 ? '' : 's'} •{' '}
                        {coll.isAutoGenerated ? '⚡ AI' : 'Custom'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchMode === 'web'
                    ? 'Search your library + explore web & YouTube…'
                    : 'Search your saved knowledge…'
                }
              />
            </div>
            <div className="search-mode-pill-group">
              <button
                type="button"
                className={`search-mode-pill ${searchMode === 'library' ? 'active' : ''}`}
                onClick={() => setSearchMode('library')}
              >
                📚 My Library
              </button>
              <button
                type="button"
                className={`search-mode-pill ${searchMode === 'web' ? 'active' : ''}`}
                onClick={() => setSearchMode('web')}
              >
                🌐 Library + Web Search
              </button>
            </div>
            <div className="chip-row">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`chip ${category === item ? 'selected' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="section-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <h2>Recently saved</h2>
                <span>{dashboardFiltered.length} items</span>
              </div>
              {isSyncing && (
                <span className="syncing-indicator">
                  <span className="sync-spinner" />
                  Syncing library...
                </span>
              )}
            </div>
            <button className="text-button" onClick={() => handleTabChange('saved')}>
              Open full library →
            </button>
          </section>

          {isLoading && items.length === 0 ? (
            <SkeletonGrid count={6} />
          ) : (
            <section className="content-grid">
            {dashboardFiltered.map((item) => {
              const isFav = favorites.has(item.id);
              return (
                <div key={item.id} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`favorite-btn ${isFav ? 'favorited' : ''}`}
                    onClick={(e) => handleToggleFavorite(item.id, e)}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label="Toggle favorite"
                  >
                    {isFav ? '♥' : '♡'}
                  </button>

                  <CardActionMenu
                    itemId={item.id}
                    item={item}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleStartEdit}
                    onDelete={handleStartDelete}
                  />

                  <Link href={`/note/${item.id}`} className="content-card">
                    <div
                      className="thumbnail"
                      style={{
                        backgroundImage: getCardThumbnailBg(item.thumbnail, item.source),
                      }}
                    >
                      {!item.thumbnail && (
                        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.85, pointerEvents: 'none' }}>
                          <span style={{ fontSize: '30px' }}>
                            {item.source === 'Instagram' ? '📸' : item.source === 'Pinterest' ? '📌' : item.source === 'YouTube' ? '▶️' : '🔖'}
                          </span>
                        </div>
                      )}
                      <span className="source-pill">{item.source}</span>
                      {item.duration && <span className="duration-pill">{item.duration}</span>}
                      {item.status === 'processing' && (
                        <span className="processing-pill">
                          <span className="pulse-dot" />
                          Gemini Analyzing...
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="card-meta">
                        <span>{item.category}</span>
                        <span>{item.savedAt || 'Recently'}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      <div className="tag-row">
                        {(item.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </section>
        )}

          {searchMode === 'web' && query.trim() && (
            <section className="web-discovery-section">
              <div className="web-discovery-header">
                <div>
                  <span className="source-pill" style={{ position: 'static', display: 'inline-block', marginBottom: '8px' }}>
                    🌐 Live Discovery & External Knowledge
                  </span>
                  <h3 style={{ margin: '4px 0', fontSize: '18px', letterSpacing: '-0.02em' }}>
                    Explore beyond your library for &ldquo;{query.trim()}&rdquo;
                  </h3>
                  <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                    Search Google, YouTube, and academic literature, or capture new items directly into SuperSave.
                  </p>
                </div>
                <button
                  className="primary-button"
                  style={{ fontSize: '12px', padding: '9px 15px' }}
                  onClick={() => {
                    setUrl(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`);
                    setShowAdd(true);
                  }}
                >
                  + Save Link
                </button>
              </div>

              <div className="web-discovery-grid">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discovery-card"
                >
                  <h4>🔍 Google Web Search</h4>
                  <p>Find articles, documentation, tutorials, and latest discussions on &ldquo;{query.trim()}&rdquo;.</p>
                  <span style={{ fontSize: '11px', color: '#ba82ff', fontWeight: 600 }}>Explore on Google ↗</span>
                </a>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discovery-card"
                >
                  <h4>▶️ YouTube Videos & Shorts</h4>
                  <p>Find video tutorials, breakdowns, lectures, and reels covering &ldquo;{query.trim()}&rdquo;.</p>
                  <span style={{ fontSize: '11px', color: '#ba82ff', fontWeight: 600 }}>Explore on YouTube ↗</span>
                </a>

                <a
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discovery-card"
                >
                  <h4>🎓 Google Scholar</h4>
                  <p>Research papers, citations, academic articles, and scientific studies on &ldquo;{query.trim()}&rdquo;.</p>
                  <span style={{ fontSize: '11px', color: '#ba82ff', fontWeight: 600 }}>Explore Scholar ↗</span>
                </a>
              </div>
            </section>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAVED KNOWLEDGE ARCHIVE */}
      {/* ========================================================================= */}
      {activeNavTab === 'saved' && (
        <>
          <header className="topbar">
            <div>
              <div className="eyebrow">ALL SAVED MEDIA</div>
              <h1>Saved Library</h1>
              <p className="muted">
                Search, filter, and review all captured reels, tutorials, and articles.
              </p>
            </div>
            <button className="primary-button" onClick={() => setShowAdd(true)}>
              + Save content
            </button>
          </header>

          <div className="toolbar" style={{ marginTop: '24px' }}>
            <div className="search-box">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all saved items, transcripts, and tags…"
              />
            </div>
          </div>

          <div className="saved-filter-bar">
            <div className="saved-filters-left">
              <span style={{ fontSize: '12px', color: '#888', marginRight: '6px' }}>Source:</span>
              {(['All', 'YouTube', 'Instagram', 'Web', 'Upload'] as const).map((src) => (
                <button
                  key={src}
                  type="button"
                  className={`chip ${savedSourceFilter === src ? 'selected' : ''}`}
                  onClick={() => setSavedSourceFilter(src)}
                >
                  {src}
                </button>
              ))}

              <span style={{ fontSize: '12px', color: '#888', marginLeft: '12px', marginRight: '6px' }}>Sort:</span>
              <select
                value={savedSort}
                onChange={(e) => setSavedSort(e.target.value as 'newest' | 'oldest' | 'title')}
                style={{
                  background: '#15101e',
                  border: '1px solid #2d243a',
                  color: '#ddd',
                  padding: '7px 11px',
                  borderRadius: '9px',
                  fontSize: '11.5px',
                  outline: 'none',
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>

            <div className="saved-view-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${savedViewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setSavedViewMode('grid')}
                title="Grid view"
              >
                ▦ Grid
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${savedViewMode === 'list' ? 'active' : ''}`}
                onClick={() => setSavedViewMode('list')}
                title="List view"
              >
                ☰ List
              </button>
            </div>
          </div>

          <div className="section-head" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Showing {savedFiltered.length} items</span>
              {isSyncing && (
                <span className="syncing-indicator">
                  <span className="sync-spinner" />
                  Syncing library...
                </span>
              )}
            </div>
          </div>

          {isLoading && items.length === 0 ? (
            <SkeletonGrid count={6} />
          ) : savedFiltered.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">🔍</span>
              <h3>No items found</h3>
              <p>Try adjusting your search query or source filter, or capture new content.</p>
              <button className="primary-button" onClick={() => setShowAdd(true)}>
                + Save something new
              </button>
            </div>
          ) : savedViewMode === 'grid' ? (
            <section className="content-grid">
              {savedFiltered.map((item) => {
                const isFav = favorites.has(item.id);
                return (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`favorite-btn ${isFav ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label="Toggle favorite"
                    >
                      {isFav ? '♥' : '♡'}
                    </button>

                    <CardActionMenu
                      itemId={item.id}
                      item={item}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onEdit={handleStartEdit}
                      onDelete={handleStartDelete}
                    />

                    <Link href={`/note/${item.id}`} className="content-card">
                      <div
                        className="thumbnail"
                        style={{
                          backgroundImage: getCardThumbnailBg(item.thumbnail, item.source),
                        }}
                      >
                        {!item.thumbnail && (
                          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.85, pointerEvents: 'none' }}>
                            <span style={{ fontSize: '30px' }}>
                              {item.source === 'Instagram' ? '📸' : item.source === 'Pinterest' ? '📌' : item.source === 'YouTube' ? '▶️' : '🔖'}
                            </span>
                          </div>
                        )}
                        <span className="source-pill">{item.source}</span>
                        {item.duration && <span className="duration-pill">{item.duration}</span>}
                      </div>
                      <div className="card-body">
                        <div className="card-meta">
                          <span>{item.category}</span>
                          <span>{item.savedAt || 'Recently'}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <div className="tag-row">
                          {(item.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </section>
          ) : (
            <section className="content-list">
              {savedFiltered.map((item) => {
                const isFav = favorites.has(item.id);
                return (
                  <Link key={item.id} href={`/note/${item.id}`} className="content-list-item">
                    <div
                      className="list-thumb"
                      style={{
                        backgroundImage: item.thumbnail
                          ? `url(${item.thumbnail})`
                          : getCardThumbnailBg(undefined, item.source),
                      }}
                    />
                    <div className="list-info">
                      <h4>{item.title}</h4>
                      <p>{item.summary}</p>
                    </div>
                    <div className="list-meta">
                      <span className="source-pill" style={{ position: 'static' }}>
                        {item.source}
                      </span>
                      {item.duration && (
                        <span style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
                          {item.duration}
                        </span>
                      )}
                      <button
                        type="button"
                        className={`favorite-btn ${isFav ? 'favorited' : ''}`}
                        style={{ position: 'static', width: 28, height: 28 }}
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        title={isFav ? 'Favorited' : 'Favorite'}
                      >
                        {isFav ? '♥' : '♡'}
                      </button>
                      <CardActionMenu
                        itemId={item.id}
                        item={item}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleStartEdit}
                        onDelete={handleStartDelete}
                        style={{ position: 'static', width: 28, height: 28 }}
                        dropdownStyle={{ top: '36px', right: 0 }}
                      />
                    </div>
                  </Link>
                );
              })}
            </section>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COLLECTIONS & AUTOMATIC CLUSTERING */}
      {/* ========================================================================= */}
      {activeNavTab === 'collections' && (
        <>
          {activeCollection ? (
            /* Collection Detail Drill-Down View */
            <div>
              <div className="collection-detail-header">
                <button
                  type="button"
                  className="breadcrumb-back-btn"
                  onClick={() => setSelectedCollectionId(null)}
                >
                  ← All Collections
                </button>

                <div className="collection-detail-info">
                  <div className="collection-detail-avatar">{activeCollection.icon}</div>
                  <div className="collection-detail-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span
                        className={`collection-type-pill ${activeCollection.isAutoGenerated ? 'ai' : 'custom'}`}
                      >
                        {activeCollection.isAutoGenerated ? '⚡ AI Smart Cluster' : '📁 Custom Vault'}
                      </span>
                      <span className="collection-count-pill">
                        {activeCollection.itemIds.length} items
                      </span>
                    </div>

                    <h1>{activeCollection.title}</h1>
                    <p>{activeCollection.description}</p>

                    <div className="tag-row">
                      {(activeCollection.tags || []).map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-head">
                <div>
                  <h2>Notes in this collection</h2>
                  <span>{activeCollection.itemIds.length} items</span>
                </div>
                {!activeCollection.isAutoGenerated && (
                  <button
                    className="text-button"
                    style={{ color: '#ff6685' }}
                    onClick={(e) => handleDeleteCustomCollection(activeCollection.id, e)}
                  >
                    Delete Collection 🗑
                  </button>
                )}
              </div>

              {(() => {
                const collItems = items.filter((i) => activeCollection.itemIds.includes(i.id));
                if (collItems.length === 0) {
                  return (
                    <div className="empty-state-card">
                      <span className="empty-icon">📂</span>
                      <h3>Collection is currently empty</h3>
                      <p>Add saved items to this collection from your library or save new videos.</p>
                      <button className="primary-button" onClick={() => handleTabChange('saved')}>
                        Browse Library →
                      </button>
                    </div>
                  );
                }
                return (
                  <section className="content-grid">
                    {collItems.map((item) => {
                      const isFav = favorites.has(item.id);
                      return (
                        <div key={item.id} style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className={`favorite-btn ${isFav ? 'favorited' : ''}`}
                            onClick={(e) => handleToggleFavorite(item.id, e)}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {isFav ? '♥' : '♡'}
                          </button>
                          <CardActionMenu
                            itemId={item.id}
                            item={item}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                            onEdit={handleStartEdit}
                            onDelete={handleStartDelete}
                          />
                          <Link href={`/note/${item.id}`} className="content-card">
                            <div
                              className="thumbnail"
                              style={{
                                backgroundImage: item.thumbnail
                                  ? `linear-gradient(180deg, rgba(13,7,20,.1), rgba(13,7,20,.85)), url(${item.thumbnail})`
                                  : undefined,
                              }}
                            >
                              <span className="source-pill">{item.source}</span>
                              {item.duration && <span className="duration-pill">{item.duration}</span>}
                            </div>
                            <div className="card-body">
                              <div className="card-meta">
                                <span>{item.category}</span>
                                <span>{item.savedAt || 'Recently'}</span>
                              </div>
                              <h3>{item.title}</h3>
                              <p>{item.summary}</p>
                              <div className="tag-row">
                                {(item.tags || []).slice(0, 3).map((tag) => (
                                  <span key={tag}>#{tag}</span>
                                ))}
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </section>
                );
              })()}
            </div>
          ) : (
            /* Collections Grid View */
            <>
              <header className="collections-header-bar">
                <div>
                  <div className="eyebrow">ORGANIZED KNOWLEDGE</div>
                  <h1>Collections</h1>
                  <p className="muted">
                    Curated thematic spaces and AI-clustered knowledge vaults.
                  </p>
                </div>

                <div className="collections-actions-group">
                  {/* Automatic Collection Creation Toggle Button */}
                  <button
                    type="button"
                    className={`auto-toggle-btn ${autoCollectionsEnabled ? 'active' : ''}`}
                    onClick={handleToggleAutoCollections}
                    title="Toggle Gemini automatic clustering of saved notes"
                  >
                    <div className="toggle-switch-track">
                      <div className="toggle-switch-thumb" />
                    </div>
                    <span>
                      ⚡ Auto-Group with AI:
                    </span>
                    <span
                      className={`toggle-status-badge ${autoCollectionsEnabled ? 'on' : 'off'}`}
                    >
                      {autoCollectionsEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => setShowCreateCollection(true)}
                  >
                    + New Collection
                  </button>
                </div>
              </header>

              {!autoCollectionsEnabled && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(35,25,48,.6)',
                    border: '1px solid #4a3468',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: '12.5px', color: '#c9bed6' }}>
                    <strong style={{ color: '#f0e6ff' }}>ℹ️ Automatic AI collections are paused.</strong>{' '}
                    Only your manually created collections are displayed below.
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    style={{ fontSize: '12px', fontWeight: 700 }}
                    onClick={handleToggleAutoCollections}
                  >
                    Enable AI Auto-Grouping →
                  </button>
                </div>
              )}

              <div className="chip-row" style={{ marginBottom: '22px' }}>
                <button
                  type="button"
                  className={`chip ${collectionFilter === 'all' ? 'selected' : ''}`}
                  onClick={() => setCollectionFilter('all')}
                >
                  All ({allCollections.length})
                </button>
                {autoCollectionsEnabled && (
                  <button
                    type="button"
                    className={`chip ${collectionFilter === 'ai' ? 'selected' : ''}`}
                    onClick={() => setCollectionFilter('ai')}
                  >
                    ⚡ AI Clusters ({autoCollections.length})
                  </button>
                )}
                <button
                  type="button"
                  className={`chip ${collectionFilter === 'custom' ? 'selected' : ''}`}
                  onClick={() => setCollectionFilter('custom')}
                >
                  📁 Custom Vaults ({userCollections.length})
                </button>
              </div>

              {displayedCollections.length === 0 ? (
                <div className="empty-state-card">
                  <span className="empty-icon">📁</span>
                  <h3>No collections found</h3>
                  <p>
                    {autoCollectionsEnabled
                      ? 'Save some media to let Gemini create smart collections, or create a custom vault.'
                      : 'You have no custom collections yet. Turn on Auto-Collections or create a custom one.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="primary-button" onClick={() => setShowCreateCollection(true)}>
                      + Create Collection
                    </button>
                    {!autoCollectionsEnabled && (
                      <button className="secondary-button" onClick={handleToggleAutoCollections}>
                        Turn On AI Collections
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <section className="collections-grid">
                  {displayedCollections.map((coll) => {
                    // Preview up to 3 thumbnails of items inside this collection
                    const previewThumbnails = items
                      .filter((i) => coll.itemIds.includes(i.id) && i.thumbnail)
                      .slice(0, 3)
                      .map((i) => i.thumbnail as string);

                    return (
                      <div
                        key={coll.id}
                        className="collection-card"
                        onClick={() => setSelectedCollectionId(coll.id)}
                      >
                        <div
                          className="collection-card-banner"
                          style={{
                            background: coll.color || 'linear-gradient(135deg, #312e81, #4c1d95)',
                          }}
                        >
                          {/* Collage thumbnails preview */}
                          {previewThumbnails.length > 0 && (
                            <div className="collection-thumb-collage">
                              {previewThumbnails.map((thumb, idx) => (
                                <img
                                  key={idx}
                                  src={thumb}
                                  alt="Preview"
                                  className="collage-img"
                                />
                              ))}
                            </div>
                          )}

                          <div className="collection-banner-overlay" />

                          <div className="collection-badge-row">
                            <span
                              className={`collection-type-pill ${
                                coll.isAutoGenerated ? 'ai' : 'custom'
                              }`}
                            >
                              {coll.isAutoGenerated ? '⚡ AI Cluster' : '📁 Custom'}
                            </span>
                            <span className="collection-count-pill">
                              {coll.itemIds.length} item{coll.itemIds.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div className="collection-icon-badge">{coll.icon}</div>
                        </div>

                        <div className="collection-card-content">
                          <h3>{coll.title}</h3>
                          <p>{coll.description}</p>

                          <div className="tag-row" style={{ marginTop: 'auto' }}>
                            {(coll.tags || []).slice(0, 3).map((t) => (
                              <span key={t}>#{t}</span>
                            ))}
                          </div>

                          <div className="collection-card-footer">
                            <span style={{ fontSize: '11px', color: '#888' }}>
                              {coll.createdAt || 'Curated'}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#c084fc', fontWeight: 600 }}>
                              Open Collection →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FAVORITES */}
      {/* ========================================================================= */}
      {activeNavTab === 'favorites' && (
        <>
          <header className="topbar">
            <div>
              <div className="eyebrow">PINNED KNOWLEDGE</div>
              <h1>Favorites</h1>
              <p className="muted">
                Quick access to your starred tutorials, high-yield recipes, and core insights.
              </p>
            </div>
            <button className="primary-button" onClick={() => setShowAdd(true)}>
              + Save content
            </button>
          </header>

          <div className="toolbar" style={{ marginTop: '24px' }}>
            <div className="search-box">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search within your favorited notes…"
              />
            </div>
            <div className="chip-row">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`chip ${category === item ? 'selected' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="section-head" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <h2>Starred items</h2>
                <span>{favoritesFiltered.length} favorited</span>
              </div>
              {isSyncing && (
                <span className="syncing-indicator">
                  <span className="sync-spinner" />
                  Syncing library...
                </span>
              )}
            </div>
          </div>

          {isLoading && items.length === 0 ? (
            <SkeletonGrid count={3} />
          ) : favoritesFiltered.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">♡</span>
              <h3>No favorited items yet</h3>
              <p>
                Click the heart icon (♡) in the corner of any note card across your library to pin your favorite tutorials and recipes here.
              </p>
              <button className="primary-button" onClick={() => handleTabChange('saved')}>
                Explore Library →
              </button>
            </div>
          ) : (
            <section className="content-grid">
              {favoritesFiltered.map((item) => {
                const isFav = favorites.has(item.id);
                return (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`favorite-btn ${isFav ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      ♥
                    </button>
                    <CardActionMenu
                      itemId={item.id}
                      item={item}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onEdit={handleStartEdit}
                      onDelete={handleStartDelete}
                    />

                    <Link href={`/note/${item.id}`} className="content-card">
                      <div
                        className="thumbnail"
                        style={{
                          backgroundImage: getCardThumbnailBg(item.thumbnail, item.source),
                        }}
                      >
                        {!item.thumbnail && (
                          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.85, pointerEvents: 'none' }}>
                            <span style={{ fontSize: '30px' }}>
                              {item.source === 'Instagram' ? '📸' : item.source === 'Pinterest' ? '📌' : item.source === 'YouTube' ? '▶️' : '🔖'}
                            </span>
                          </div>
                        )}
                        <span className="source-pill">{item.source}</span>
                        {item.duration && <span className="duration-pill">{item.duration}</span>}
                      </div>
                      <div className="card-body">
                        <div className="card-meta">
                          <span>{item.category}</span>
                          <span>{item.savedAt || 'Recently'}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <div className="tag-row">
                          {(item.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* QUICK CAPTURE MODAL */}
      {/* ========================================================================= */}
      {showAdd && (
        <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdd(false)}>
              ×
            </button>
            <div className="eyebrow">QUICK CAPTURE</div>
            <h2>Save something useful.</h2>
            <p className="muted">
              Paste a Reel, YouTube, or article URL. We will save its details immediately and extract structured knowledge using Gemini.
            </p>

            <input
              className="modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/reel/..."
              autoFocus
            />

            <div style={{ marginTop: '10px' }}>
              <div className="eyebrow" style={{ fontSize: '10px', marginBottom: '6px' }}>
                AI EXTRACTION SETTING
              </div>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`mode-btn ${extractionMode === 'video_lowres' ? 'active' : ''}`}
                  onClick={() => handleModeChange('video_lowres')}
                >
                  <strong>🎬 Visual Mode (480p Video)</strong>
                  <small>Multimodal: watches visual slides, text, diagrams, and video edits</small>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${extractionMode === 'audio_fast' ? 'active' : ''}`}
                  onClick={() => handleModeChange('audio_fast')}
                >
                  <strong>⚡ Fast Mode (Audio Track)</strong>
                  <small>Fastest extraction (~3s). Best for talks, lectures, and narrated reels</small>
                </button>
              </div>
            </div>

            {credits && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  margin: '14px 0 6px',
                  fontSize: '11.5px',
                  background: credits.remaining === 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(186, 130, 255, 0.08)',
                  border: credits.remaining === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(186, 130, 255, 0.2)',
                  color: credits.remaining === 0 ? '#fca5a5' : '#d8b4fe',
                }}
              >
                <span>⚡ 1 Save = 1 Credit</span>
                <span
                  onClick={() => setShowCreditsModal(true)}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  title="Click to view plan details"
                >
                  <strong>{credits.remaining}</strong> of {credits.limit} remaining this month →
                </span>
              </div>
            )}

            <button
              className="primary-button wide"
              onClick={saveUrl}
              disabled={credits ? credits.remaining <= 0 : false}
              style={{
                opacity: credits && credits.remaining <= 0 ? 0.6 : 1,
                cursor: credits && credits.remaining <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {credits && credits.remaining <= 0 ? 'Monthly Limit Reached' : 'Save & Analyze with Gemini'}
            </button>
            {message && <div className="status-message">{message}</div>}
            <div className="modal-tip">
              Tip: When Auto-Collections is ON, new saves are automatically organized into intelligent topic collections.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE CUSTOM COLLECTION MODAL */}
      {/* ========================================================================= */}
      {showCreateCollection && (
        <div className="modal-backdrop" onMouseDown={() => setShowCreateCollection(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateCollection(false)}>
              ×
            </button>
            <div className="eyebrow">NEW COLLECTION</div>
            <h2>Create Custom Vault</h2>
            <p className="muted">
              Organize your saved notes into a personalized collection.
            </p>

            <form onSubmit={handleCreateCustomCollection} style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                Collection Icon
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {['📁', '⭐', '🚀', '💡', '🧠', '⚡', '💻', '🍳', '🎨', '📚', '📈'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCollIcon(emoji)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: newCollIcon === emoji ? '#3b255c' : '#171221',
                      border: newCollIcon === emoji ? '1px solid #9c60f2' : '1px solid #2e243c',
                      fontSize: '18px',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                Collection Name
              </label>
              <input
                className="modal-input"
                style={{ margin: '0 0 14px' }}
                value={newCollTitle}
                onChange={(e) => setNewCollTitle(e.target.value)}
                placeholder="e.g. Weekend Engineering, High-Protein Meals"
                required
              />

              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                Description (Optional)
              </label>
              <input
                className="modal-input"
                style={{ margin: '0 0 16px' }}
                value={newCollDesc}
                onChange={(e) => setNewCollDesc(e.target.value)}
                placeholder="Brief summary of what this collection is for…"
              />

              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                Select Notes to Include ({newCollSelectedItems.length} selected)
              </label>
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #2d243a',
                  borderRadius: '10px',
                  background: '#0e0b14',
                  padding: '8px',
                  marginBottom: '18px',
                }}
              >
                {items.map((item) => {
                  const isChecked = newCollSelectedItems.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: isChecked ? '#fff' : '#aaa',
                        background: isChecked ? '#1c1527' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setNewCollSelectedItems((prev) =>
                            isChecked ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                          );
                        }}
                      />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '10px', color: '#777' }}>{item.category}</span>
                    </label>
                  );
                })}
              </div>

              <button type="submit" className="primary-button wide">
                Create Collection
              </button>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <EditContentModal
          item={editingItem}
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          onSuccess={(updated) => {
            setItems((current) => {
              const next = current.map((it) => (it.id === updated.id ? { ...it, ...updated } : it));
              try {
                localStorage.setItem('supersave_cached_items', JSON.stringify(next));
              } catch {}
              return next;
            });
          }}
        />
      )}

      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </AppShell>
  );
}
