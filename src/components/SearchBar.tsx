import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update search query from URL when on photos page
  useEffect(() => {
    if (location.pathname === '/photos') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      setQuery(q);
    }
  }, [location]);

  const handleSearch = (searchQuery: string) => {
    if (location.pathname === '/photos') {
      // Real-time filtering on Photos page
      if (searchQuery.trim()) {
        navigate(`/photos?q=${encodeURIComponent(searchQuery)}`, { replace: true });
      } else {
        navigate('/photos', { replace: true });
      }
    } else {
      // Regular navigation for other pages
      if (searchQuery.trim()) {
        navigate(`/photos?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleInputChange = (e: string) => {
    setQuery(e);
    // Auto-update URL as user types (only on photos page)
    if (location.pathname === '/photos') {
      handleSearch(e);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (location.pathname === '/photos') {
      navigate('/photos', { replace: true });
    }
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              handleSearch(query);
            }
          }}
          placeholder="Search your photos"
          className="pl-16 pr-12 h-14 text-lg rounded-full transition-shadow"
          style={{ backgroundColor: '#212121', color: '#ffffff' }}
          aria-label="Search"
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
