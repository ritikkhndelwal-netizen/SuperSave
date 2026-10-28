import './globals.css';

export const metadata = {
  title: 'SuperSave — Your saved content, actually useful',
  description: 'Turn saved videos into structured, searchable knowledge.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SuperSave',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09070f',
};

import { AuthProvider } from '../lib/auth-context';
import { CreditsProvider } from '../lib/credits-context';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CreditsProvider>{children}</CreditsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
