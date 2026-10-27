import './globals.css';

export const metadata = {
  title: 'SuperSave — Your saved content, actually useful',
  description: 'Turn saved videos into structured, searchable knowledge.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
