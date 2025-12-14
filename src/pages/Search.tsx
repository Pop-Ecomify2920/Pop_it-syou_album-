import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  X, 
  Calendar, 
  MapPin, 
  Camera, 
  Tag, 
  Star,
  Image as ImageIcon,
  Video,
  Folder,
  User,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

// Mock search results
const mockAssets = [
  { id: 1, type: 'image', title: 'Mountain landscape', date: '2025-01-15', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
  { id: 2, type: 'image', title: 'Nature scene', date: '2025-01-14', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400' },
  { id: 3, type: 'video', title: 'Forest path', date: '2025-01-13', src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400' },
];

const mockAlbums = [
  { id: 1, name: 'Vacation 2025', photoCount: 45 },
  { id: 2, name: 'Family Photos', photoCount: 120 },
];

const mockPeople = [
  { id: 1, name: 'John Doe', photoCount: 23 },
  { id: 2, name: 'Jane Smith', photoCount: 15 },
];

type ResultType = 'all' | 'assets' | 'albums' | 'people';
type SearchFilter = {
  dateRange?: { start: string; end: string };
  location?: { country?: string; state?: string; city?: string };
  camera?: { make?: string; model?: string };
  tags?: string[];
  rating?: number;
  mediaType?: 'all' | 'image' | 'video';
  displayOptions?: {
    notInAlbum?: boolean;
    archived?: boolean;
    favorites?: boolean;
  };
  aiSearch?: boolean;
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [resultType, setResultType] = useState<ResultType>('all');
  const [filters, setFilters] = useState<SearchFilter>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // Update active filters display
  useMemo(() => {
    const active: string[] = [];
    if (filters.dateRange?.start) active.push('Date range');
    if (filters.location?.country || filters.location?.state || filters.location?.city) active.push('Location');
    if (filters.camera?.make || filters.camera?.model) active.push('Camera');
    if (filters.tags && filters.tags.length > 0) active.push(`${filters.tags.length} tag(s)`);
    if (filters.rating) active.push(`Rating: ${filters.rating}+`);
    if (filters.mediaType && filters.mediaType !== 'all') active.push(filters.mediaType);
    if (filters.displayOptions?.notInAlbum) active.push('Not in album');
    if (filters.displayOptions?.archived) active.push('Archived');
    if (filters.displayOptions?.favorites) active.push('Favorites');
    if (filters.aiSearch) active.push('AI Search');
    setActiveFilters(active);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (filterName: string) => {
    if (filterName === 'Date range') {
      setFilters(prev => ({ ...prev, dateRange: undefined }));
    } else if (filterName === 'Location') {
      setFilters(prev => ({ ...prev, location: undefined }));
    } else if (filterName === 'Camera') {
      setFilters(prev => ({ ...prev, camera: undefined }));
    } else if (filterName.startsWith('tag')) {
      setFilters(prev => ({ ...prev, tags: [] }));
    } else if (filterName.startsWith('Rating')) {
      setFilters(prev => ({ ...prev, rating: undefined }));
    } else if (filterName === 'image' || filterName === 'video') {
      setFilters(prev => ({ ...prev, mediaType: 'all' }));
    } else if (filterName === 'Not in album') {
      setFilters(prev => ({ ...prev, displayOptions: { ...prev.displayOptions, notInAlbum: false } }));
    } else if (filterName === 'Archived') {
      setFilters(prev => ({ ...prev, displayOptions: { ...prev.displayOptions, archived: false } }));
    } else if (filterName === 'Favorites') {
      setFilters(prev => ({ ...prev, displayOptions: { ...prev.displayOptions, favorites: false } }));
    } else if (filterName === 'AI Search') {
      setFilters(prev => ({ ...prev, aiSearch: false }));
    }
  };

  const clearAllFilters = () => {
    setFilters({});
    setQuery('');
  };

  // Filter results based on query and filters
  const filteredAssets = useMemo(() => {
    return mockAssets.filter(asset => {
      if (query && !asset.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.mediaType && filters.mediaType !== 'all' && asset.type !== filters.mediaType) return false;
      return true;
    });
  }, [query, filters]);

  const filteredAlbums = useMemo(() => {
    return mockAlbums.filter(album => {
      if (query && !album.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query]);

  const filteredPeople = useMemo(() => {
    return mockPeople.filter(person => {
      if (query && !person.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query]);

  const hasResults = filteredAssets.length > 0 || filteredAlbums.length > 0 || filteredPeople.length > 0;
  const showResults = query || activeFilters.length > 0;

  return (
    <Layout>
      <div className="space-y-6 bg-immich-bg dark:bg-immich-dark-bg">
        {/* Search Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your photos, albums, and people..."
                className="pl-12 pr-4 h-12 bg-gray-50 dark:bg-gray-600 text-lg"
                autoFocus
                aria-label="Search"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(true)}
              className="shrink-0"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* AI Search Option */}
          <div className="flex items-center gap-2">
            <Button
              variant={filters.aiSearch ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange('aiSearch', !filters.aiSearch)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI-powered search
            </Button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {filter}
                  <button
                    onClick={() => removeFilter(filter)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label={`Remove ${filter} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Result Type Tabs */}
          {showResults && (
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 w-fit">
              {(['all', 'assets', 'albums', 'people'] as ResultType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setResultType(type)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                    resultType === type
                      ? 'bg-immich-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={`Show ${type} results`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Results */}
        {!showResults ? (
          /* Empty State - No Search */
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-immich-primary/10 rounded-full">
                  <SearchIcon className="w-12 h-12 text-immich-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
                Start searching
              </h2>
              <p className="text-muted-foreground mb-6">
                Search for photos, albums, or people. Use filters to narrow down your results.
              </p>
              <Button onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Open filters
              </Button>
            </div>
          </div>
        ) : !hasResults ? (
          /* Empty State - No Results */
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <SearchIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
                No results found
              </h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search query or filters
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          /* Results Grid */
          <div className="space-y-8">
            {/* Assets Results */}
            {(resultType === 'all' || resultType === 'assets') && filteredAssets.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                  Assets ({filteredAssets.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-immich-card dark:bg-immich-dark-gray"
                    >
                      <img
                        src={asset.src}
                        alt={asset.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {asset.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm">
                          <p className="font-medium truncate">{asset.title}</p>
                          <p className="text-xs text-white/80">{format(new Date(asset.date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Albums Results */}
            {(resultType === 'all' || resultType === 'albums') && filteredAlbums.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                  Albums ({filteredAlbums.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredAlbums.map((album) => (
                    <div
                      key={album.id}
                      className="group bg-immich-card dark:bg-immich-dark-gray rounded-xl border border-border overflow-hidden hover:border-immich-primary/50 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-immich-primary/20 to-immich-primary/5">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Folder className="w-12 h-12 text-immich-primary/50" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-immich-fg dark:text-immich-dark-fg mb-1">
                          {album.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People Results */}
            {(resultType === 'all' || resultType === 'people') && filteredPeople.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                  People ({filteredPeople.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPeople.map((person) => (
                    <div
                      key={person.id}
                      className="group bg-immich-card dark:bg-immich-dark-gray rounded-xl border border-border overflow-hidden hover:border-immich-primary/50 transition-all cursor-pointer p-6 text-center"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 bg-immich-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-immich-primary" />
                      </div>
                      <h3 className="font-semibold text-immich-fg dark:text-immich-dark-fg mb-1">
                        {person.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {person.photoCount} {person.photoCount === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Load More */}
            {hasResults && (
              <div className="flex justify-center pt-4">
                <Button variant="outline">Load more results</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Advanced Search Filters
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search Type */}
            <div className="space-y-2">
              <Label>Search type</Label>
              <div className="flex gap-4 flex-wrap">
                {['Context', 'File name or extension', 'Description', 'OCR'].map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="searchType"
                      className="accent-immich-primary"
                      defaultChecked={type === 'Context'}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Search by context */}
            <div className="space-y-2">
              <Label>Search by context</Label>
              <Input placeholder="Sunrise on the beach" />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start date
                </Label>
                <Input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End date
                </Label>
                <Input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value,
                  })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Input
                    placeholder="Search country..."
                    value={filters.location?.country || ''}
                    onChange={(e) => handleFilterChange('location', {
                      ...filters.location,
                      country: e.target.value,
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">State</Label>
                  <Input
                    placeholder="Search state..."
                    value={filters.location?.state || ''}
                    onChange={(e) => handleFilterChange('location', {
                      ...filters.location,
                      state: e.target.value,
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input
                    placeholder="Search city..."
                    value={filters.location?.city || ''}
                    onChange={(e) => handleFilterChange('location', {
                      ...filters.location,
                      city: e.target.value,
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Camera */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Make</Label>
                  <Input
                    placeholder="Search camera make..."
                    value={filters.camera?.make || ''}
                    onChange={(e) => handleFilterChange('camera', {
                      ...filters.camera,
                      make: e.target.value,
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Model</Label>
                  <Input
                    placeholder="Search camera model..."
                    value={filters.camera?.model || ''}
                    onChange={(e) => handleFilterChange('camera', {
                      ...filters.camera,
                      model: e.target.value,
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>
              <Input
                placeholder="Enter tags (comma separated)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    if (value.trim()) {
                      const tags = value.split(',').map(t => t.trim()).filter(Boolean);
                      handleFilterChange('tags', [...(filters.tags || []), ...tags]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {filters.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = filters.tags?.filter((_, i) => i !== idx);
                          handleFilterChange('tags', newTags);
                        }}
                        className="ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Minimum rating
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleFilterChange('rating', rating)}
                    className={`p-2 rounded-lg border transition-colors ${
                      filters.rating === rating
                        ? 'bg-immich-primary text-primary-foreground border-immich-primary'
                        : 'bg-secondary border-border hover:border-immich-primary/50'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${filters.rating === rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Media Type & Display Options */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label>Media type</Label>
                <div className="flex gap-4">
                  {(['All', 'Image', 'Video'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        className="accent-immich-primary"
                        checked={filters.mediaType === (type === 'All' ? 'all' : type.toLowerCase()) || (!filters.mediaType && type === 'All')}
                        onChange={() => handleFilterChange('mediaType', type === 'All' ? 'all' : type.toLowerCase())}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Display options</Label>
                <div className="space-y-2">
                  {[
                    { key: 'notInAlbum', label: 'Not in any album' },
                    { key: 'archived', label: 'Archive' },
                    { key: 'favorites', label: 'Favorites' },
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.displayOptions?.[option.key as keyof typeof filters.displayOptions] || false}
                        onCheckedChange={(checked) => handleFilterChange('displayOptions', {
                          ...filters.displayOptions,
                          [option.key]: checked,
                        })}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button variant="secondary" className="flex-1" onClick={clearAllFilters}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>
              Apply filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

