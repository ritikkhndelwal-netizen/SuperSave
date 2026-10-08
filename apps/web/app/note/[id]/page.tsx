import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '../../../components/AppShell';
import { NoteClient } from '../../../components/NoteClient';
import { mockContent } from '../../../lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = mockContent.find((content) => content.id === id);
  let item = fallback;
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${api}/api/content/${id}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      item = data.item;
    }
  } catch { /* API may not be running while building the UI. */ }
  if (!item) notFound();
  return <AppShell><div className="note-page"><Link href="/dashboard" className="back-link">← Back to library</Link><NoteClient item={item!} /></div></AppShell>;
}
