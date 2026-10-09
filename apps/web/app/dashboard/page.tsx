import { Suspense } from 'react';
import { DashboardClient } from '../../components/DashboardClient';
import { mockContent } from '../../lib/mock-data';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#aaa' }}>Loading SuperSave...</div>}>
      <DashboardClient items={mockContent} />
    </Suspense>
  );
}
