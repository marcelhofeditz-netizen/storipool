import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Selfpublishbot',
  description: 'Veröffentliche dein eigenes Buch mit KI – im Chat.',
  icons: { icon: '/assets/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="top"><a href="/" className="brand">SELFPUBLISHBOT</a></header>
        <main className="box">{children}</main>
        <footer className="foot">
          <a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutz</a> · <a href="/bibliotheksordnung.html">Bibliotheksordnung</a>
        </footer>
      </body>
    </html>
  );
}
