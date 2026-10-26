import type { Metadata } from 'next';
import './globals.css';
import { siteUrl } from '@/lib/site-url';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Madurai Express | South Indian Restaurant in Avaniyapuram, Madurai',
    template: '%s | Madurai Express',
  },
  description: 'Explore South Indian dining at MADURAI EXPRESS in Avaniyapuram, Madurai.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
