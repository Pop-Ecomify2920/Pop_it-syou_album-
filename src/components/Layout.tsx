import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { SearchBar } from './SearchBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-immich-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-immich-primary focus:ring-offset-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden" role="main">
        {/* Top Bar */}
        <header className="h-16 border-b border-border flex items-center px-6 shrink-0" role="banner">
          <SearchBar />
        </header>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6" tabIndex={-1}>
          {children}
        </div>
      </main>
    </div>
  );
}
