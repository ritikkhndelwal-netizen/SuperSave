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

  private rowToItem(row: Record<string, unknown>): Item {
    let item: Item | null = null;
    if (row.data) {
      try {
        item = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data as Item);
      } catch {}
    }
    if (!item) {
      item = {
        id: String(row.id || ''),
        userId: row.user_id ? String(row.user_id) : undefined,
        url: String(row.url || ''),
        status: (row.status || 'ready') as Item['status'],
        title: String(row.title || ''),
        content_type: row.content_type ? String(row.content_type) : 'general',
        category: String(row.category || 'General'),
        subcategory: row.subcategory ? String(row.subcategory) : '',
        summary: String(row.summary || ''),
        summary_detail: (row.summary_detail as Item['summary_detail']) || undefined,
        notes: String(row.notes || ''),
        tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
        keyTakeaways: Array.isArray(row.key_takeaways) ? (row.key_takeaways as string[]) : [],
        chapters: (row.chapters as Item['chapters']) || [],
        visual_insights: (row.visual_insights as Item['visual_insights']) || undefined,
        code_snippets: (row.code_snippets as Item['code_snippets']) || [],
        detected_resources: (row.detected_resources as Item['detected_resources']) || [],
        detected_products: (row.detected_products as Item['detected_products']) || [],
        facts_and_claims: (row.facts_and_claims as Item['facts_and_claims']) || [],
        metadata: (row.metadata as Item['metadata']) || undefined,
        action_items: Array.isArray(row.action_items) ? (row.action_items as string[]) : [],
        personalNote: String(row.personal_note || ''),
        source: (row.source || 'Web') as Item['source'],
        duration: row.duration ? String(row.duration) : '',
        thumbnail: row.thumbnail ? String(row.thumbnail) : '',
        embed_url: row.embed_url ? String(row.embed_url) : '',
        extractionMode: (row.extraction_mode || 'video_lowres') as Item['extractionMode'],
        createdAt: String(row.created_at || new Date().toISOString()),
      };
    }
    // Ensure primary identifiers match the top-level table columns
    item.id = String(row.id || item.id);
    item.userId = row.user_id ? String(row.user_id) : item.userId;
    item.url = String(row.url || item.url);
    item.status = (row.status || item.status) as Item['status'];
    item.title = String(row.title || item.title);
    item.category = String(row.category || item.category);
    item.source = (row.source || item.source) as Item['source'];
    item.createdAt = String(row.created_at || item.createdAt);
    return item;
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
          const item = this.rowToItem(row);
          this.setLocal(item.id, item);
        }
      } else {
        // If Supabase is currently empty, push existing local items to Supabase
        const localItems = this.valuesLocal();
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

  private getLocal(id: string): Item | undefined {
    const stmt = this.db.prepare('SELECT data FROM content_items WHERE id = ?');
    const row = stmt.get(id) as { data: string } | undefined;
    if (!row) return undefined;
    try {
      return JSON.parse(row.data) as Item;
    } catch {
      return undefined;
    }
  }

  get(id: string): Item | undefined {
    return this.getLocal(id);
  }

  async getAsync(id: string): Promise<Item | undefined> {
    if (this.supabase && this.isSupabaseReady) {
      try {
        const { data, error } = await this.supabase
          .from('content_items')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const item = this.rowToItem(data);
          this.setLocal(item.id, item);
          return item;
        }
      } catch (err) {
        console.warn(`[Database] Supabase get error for ${id}, falling back to local:`, err);
      }
    }
    return this.getLocal(id);
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

  valuesLocal(userId?: string): Item[] {
    const stmt = this.db.prepare('SELECT data FROM content_items ORDER BY created_at DESC');
    const rows = stmt.all() as Array<{ data: string }>;
    const all = rows
      .map((r) => {
        try {
          return JSON.parse(r.data) as Item;
        } catch {
          return null;
        }
      })
      .filter((item): item is Item => item !== null);

    if (userId) {
      return all.filter((item) => !item.userId || item.userId === userId);
    }
    return all.filter((item) => !item.userId);
  }

  values(): Item[] {
    return this.valuesLocal();
  }

  async valuesAsync(userId?: string): Promise<Item[]> {
    if (this.supabase && this.isSupabaseReady) {
      try {
        let query = this.supabase
          .from('content_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        } else {
          query = query.is('user_id', null);
        }

        const { data, error } = await query;
        if (!error && data) {
          const items: Item[] = [];
          for (const row of data) {
            const item = this.rowToItem(row);
            this.setLocal(item.id, item);
            items.push(item);
          }
          return items;
        } else if (error) {
          console.warn('[Database] Supabase query notice:', error.message);
        }
      } catch (err) {
        console.warn('[Database] Supabase values error, falling back to local:', err);
      }
    }
    return this.valuesLocal(userId);
  }

  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM content_items');
    const row = stmt.get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  }
}

export const dbStore = new ContentDatabase();
