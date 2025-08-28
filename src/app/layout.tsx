import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/layout/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export const metadata: Metadata = {
  title: 'TechFlow Operations Manager',
  description: 'Gestión integral de operaciones de servicios técnicos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col',
          inter.variable,
          spaceGrotesk.variable,
          sourceCodePro.variable
        )}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <Providers>
              <div className="flex-1">
                  {children}
              </div>
          </Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
