import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Live Polling System',
  description: 'Real-time polling for teachers and students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
