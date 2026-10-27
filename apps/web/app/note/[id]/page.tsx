import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { NoteClient } from '../../../components/NoteClient';

export const dynamic = 'force-dynamic';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let item = null;
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${api}/api/content/${id}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      item = data.item;
    }
  } catch {
    /* If API is offline or requires client authentication, NoteClient will fetch with user token */
  }

  return (
    <AppShell>
      <div className="note-page">
        <Link href="/dashboard" className="back-link">
          ← Back to library
        </Link>
        <NoteClient id={id} item={item || undefined} />
      </div>
    </AppShell>
  );
}

