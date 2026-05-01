import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const themeScript = `
  try {
    const stored = localStorage.getItem('theme');
    const preferred = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', preferred === 'dark');
  } catch (error) {}
`;

export const metadata = {
  title: 'Team Hub',
  description: 'Collaborative workspace for goals, action items, and announcements.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" theme="system" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
