import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type { Item } from './index';

// Store the SQLite database in the api service's data directory
const DB_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'supersave.db');

export class ContentDatabase {
  private db: DatabaseSync;

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

  has(id: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM content_items WHERE id = ?');
    return Boolean(stmt.get(id));
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM content_items WHERE id = ?');
    stmt.run(id);
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
