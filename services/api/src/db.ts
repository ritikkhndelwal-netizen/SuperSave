import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Item } from './index';

// Path to SQLite db file (local fallback & high-speed read cache)
const DB_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'supersave.db');

export class ContentDatabase {
  private db: DatabaseSync;
  private supabase: SupabaseClient | null = null;
  private isSupabaseReady = false;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS content_items (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_content_created ON content_items(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status);
    `);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLIC_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
      this.isSupabaseReady = true;
    }

    this.initSupabase();
  }

  private async initSupabase() {
    if (!this.supabase) {
      console.log('[Database] Running in local SQLite mode.');
      return;
    }

    try {
      const { data, error } = await this.supabase.from('content_items').select('*').limit(100);
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('[Database] Supabase connected! Note: "content_items" table not yet created. Run services/api/db/schema.sql in Supabase SQL Editor.');
        } else {
          console.warn('[Database] Supabase notice:', error.message);
        }
        return;
      }

      console.log(`[Database] Supabase PostgreSQL connected! Found ${data?.length || 0} remote items.`);

      // Hydrate local cache from Supabase
      if (data && data.length > 0) {
        for (const row of data) {
          const item = (row.data as Item) || {
            id: row.id,
            userId: row.user_id || undefined,
            url: row.url,
            status: row.status,
            title: row.title,
            category: row.category,
            source: row.source,
            createdAt: row.created_at,
            summary: row.summary || '',
            notes: row.notes || '',
            tags: row.tags || [],
            keyTakeaways: row.key_takeaways || [],
            personalNote: row.personal_note || '',
          };
          this.setLocal(item.id, item);
        }
      } else {
        // If Supabase is currently empty, push existing local items to Supabase
        const localItems = this.values();
        if (localItems.length > 0) {
          console.log(`[Database] Syncing ${localItems.length} initial items to Supabase…`);
          for (const item of localItems) {
            this.set(item.id, item);
          }
        }
      }
    } catch (err) {
      console.warn('[Database] Supabase init check:', err);
    }
  }

  private setLocal(id: string, item: Item) {
    const stmt = this.db.prepare(`
      INSERT INTO content_items (id, url, status, title, category, source, created_at, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        url = excluded.url,
        status = excluded.status,
        title = excluded.title,
        category = excluded.category,
        source = excluded.source,
        data = excluded.data
    `);
    stmt.run(
      id,
      item.url,
      item.status,
      item.title || '',
      item.category || 'General',
      item.source || 'Web',
      item.createdAt || new Date().toISOString(),
      JSON.stringify(item)
    );
  }

  get(id: string): Item | undefined {
    const stmt = this.db.prepare('SELECT data FROM content_items WHERE id = ?');
    const row = stmt.get(id) as { data: string } | undefined;
    if (!row) return undefined;
    try {
      return JSON.parse(row.data) as Item;
    } catch {
      return undefined;
    }
  }

  set(id: string, item: Item): void {
    // 1. Write to local SQLite immediately
    this.setLocal(id, item);

    // 2. Asynchronously sync to Supabase PostgreSQL
    if (this.supabase && this.isSupabaseReady) {
      Promise.resolve(
        this.supabase
          .from('content_items')
          .upsert({
            id,
            user_id: item.userId || null,
            url: item.url,
            status: item.status,
          title: item.title || '',
          content_type: item.content_type || 'general',
          category: item.category || 'General',
          subcategory: item.subcategory || '',
          summary: item.summary || '',
          summary_detail: item.summary_detail || {},
          notes: item.notes || '',
          tags: item.tags || [],
          key_takeaways: item.keyTakeaways || [],
          chapters: item.chapters || [],
          visual_insights: item.visual_insights || {},
          code_snippets: item.code_snippets || [],
          detected_resources: item.detected_resources || [],
          detected_products: item.detected_products || [],
          facts_and_claims: item.facts_and_claims || [],
          metadata: item.metadata || {},
          action_items: item.action_items || [],
          personal_note: item.personalNote || '',
          source: item.source || 'Web',
          duration: item.duration || '',
          thumbnail: item.thumbnail || '',
          embed_url: item.embed_url || '',
          extraction_mode: item.extractionMode || 'video_lowres',
          data: item,
          updated_at: new Date().toISOString(),
        })
      )
        .then(({ error }) => {
          if (error) {
            console.warn(`[Supabase] Sync failed for ${id}:`, error.message);
          }
        })
        .catch((err: unknown) => console.warn(`[Supabase] Sync error:`, err));
    }
  }

  has(id: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM content_items WHERE id = ?');
    return Boolean(stmt.get(id));
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM content_items WHERE id = ?');
    stmt.run(id);

    if (this.supabase && this.isSupabaseReady) {
      Promise.resolve(
        this.supabase
          .from('content_items')
          .delete()
          .eq('id', id)
      )
        .then(({ error }) => {
          if (error) console.warn(`[Supabase] Delete failed for ${id}:`, error.message);
        })
        .catch((err: unknown) => console.warn(`[Supabase] Delete error:`, err));
    }

    return true;
  }

  values(): Item[] {
    const stmt = this.db.prepare('SELECT data FROM content_items ORDER BY created_at DESC');
    const rows = stmt.all() as Array<{ data: string }>;
    return rows
      .map((r) => {
        try {
          return JSON.parse(r.data) as Item;
        } catch {
          return null;
        }
      })
      .filter((item): item is Item => item !== null);
  }

  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM content_items');
    const row = stmt.get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  }
}

export const dbStore = new ContentDatabase();
