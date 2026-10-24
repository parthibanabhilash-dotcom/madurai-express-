export const metadata = {
  title: 'Administration | Madurai Express',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="admin-root">
      {children}
    </main>
  );
}
