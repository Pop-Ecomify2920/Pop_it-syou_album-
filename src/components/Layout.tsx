import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { SearchBar } from './SearchBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const isMobile = useIsMobile();

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

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
      
      {/* Sidebar - Hidden on Mobile */}
      {!isMobile && (
        <div className={`relative transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      )}

      <main id="main-content" className="flex-1 flex flex-col overflow-hidden" role="main">
        {/* Top Bar */}
        <header className={`h-16 border-b border-border flex items-center px-4 md:px-6 shrink-0 ${isMobile ? 'justify-between' : ''}`} role="banner">
          {/* Mobile Menu Toggle - Only show on mobile */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              className="md:hidden"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          )}
          <SearchBar />
        </header>
        
        {/* Content */}
        <div className="flex-1 overflow-auto pr-0 pl-0 md:p-6" tabIndex={-1}>
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar - Floating */}
      {isMobile && sidebarOpen && (
        <div className="fixed top-0 left-0 h-screen w-64 z-50">
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      )}
    </div>
  );
}
