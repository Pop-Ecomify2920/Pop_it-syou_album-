import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-1 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
            onFocus={() => {
              // Navigate to search page on focus (optional)
              // navigate('/search');
            }}
            placeholder="Search your photos"
            className="pl-12 pr-4 h-11 bg-gray-50 dark:bg-gray-600"
            aria-label="Search"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters(true)}
          className="shrink-0"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Search Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Search options
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search type</label>
              <div className="flex gap-4">
                {['Context', 'File name or extension', 'Description', 'OCR'].map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="searchType" className="accent-primary" defaultChecked={type === 'Context'} />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Search by context */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search by context</label>
              <Input placeholder="Sunrise on the beach" />
            </div>

            {/* Place */}
            <div className="space-y-2">
              <label className="text-sm font-medium">PLACE</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Country</label>
                  <Input placeholder="Search country..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">State</label>
                  <Input placeholder="Search state..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">City</label>
                  <Input placeholder="Search city..." />
                </div>
              </div>
            </div>

            {/* Camera */}
            <div className="space-y-2">
              <label className="text-sm font-medium">CAMERA</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Make</label>
                  <Input placeholder="Search camera make..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Model</label>
                  <Input placeholder="Search camera model..." />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">START DATE</label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">END DATE</label>
                <Input type="date" />
              </div>
            </div>

            {/* Media Type & Display Options */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium">MEDIA TYPE</label>
                <div className="flex gap-4">
                  {['All', 'Image', 'Video'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="mediaType" className="accent-primary" defaultChecked={type === 'All'} />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">DISPLAY OPTIONS</label>
                <div className="flex gap-4">
                  {['Not in any album', 'Archive', 'Favorites'].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-primary" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowFilters(false)}>
              Clear all
            </Button>
            <Button variant="auth" className="flex-1" onClick={() => setShowFilters(false)}>
              Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
