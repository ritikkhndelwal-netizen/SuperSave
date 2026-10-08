import './globals.css';

export const metadata = {
  title: 'ReelMind — Your saved content, actually useful',
  description: 'Turn saved videos into structured, searchable knowledge.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
