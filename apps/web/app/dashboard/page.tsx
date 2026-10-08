import { AppShell } from '../../components/AppShell';
import { DashboardClient } from '../../components/DashboardClient';
import { mockContent } from '../../lib/mock-data';

export default function DashboardPage() {
  return <AppShell><DashboardClient items={mockContent} /></AppShell>;
}
