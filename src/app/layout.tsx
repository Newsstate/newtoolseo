import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeepSEO — Complete SEO Analysis Suite',
  description: 'Full-stack SEO audit: on-page, technical, crawl, security, performance, competitor comparison, rendering & more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
