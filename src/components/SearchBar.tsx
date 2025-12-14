import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }
          }}
          placeholder="Search your photos"
          className="pl-16 pr-6 h-14 text-lg rounded-full shadow-md hover:shadow-lg transition-shadow"
          style={{ backgroundColor: '#212121', color: '#ffffff' }}
          aria-label="Search"
        />
      </div>
    </div>
  );
}
