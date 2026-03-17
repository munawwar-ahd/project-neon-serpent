import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Neon Serpent | Arcade Snake Game',
  description: 'A visually polished, neon-infused classic snake game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-hidden bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
