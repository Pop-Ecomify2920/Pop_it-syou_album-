import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ChevronDown, LayoutGrid, Pencil, Trash2, MoreHorizontal, Calendar, Image as ImageIcon, Users, FolderOpen } from 'lucide-react';
import { useAlbums, Album } from '@/hooks/useAlbums';
import { useAlbumsLocal } from '@/hooks/useAlbumsLocal';
import { usePhotos } from '@/hooks/usePhotos';
import { AlbumDialog } from '@/components/AlbumDialog';
import { DeleteAlbumDialog } from '@/components/DeleteAlbumDialog';
import { useAlbumPhotos } from '@/hooks/useAlbumPhotos';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

type Tab = 'all' | 'owned' | 'shared';
type SortOption = 'date' | 'name' | 'recent';
type GroupOption = 'none' | 'year' | 'owner';

export default function Albums() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [groupBy, setGroupBy] = useState<GroupOption>('year');
  const [expandedYears, setExpandedYears] = useState<number[]>([new Date().getFullYear()]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);

  // Use local storage version for albums (works without Supabase auth)
  const { albums, isLoading, createAlbum, updateAlbum, deleteAlbum } = useAlbumsLocal();
  const { addPhotosToAlbum, getPhotoCount, removeAllPhotosFromAlbum, getAlbumPhotos } = useAlbumPhotos();
  const { getAllPhotos } = usePhotos();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'owned', label: 'Owned' },
    { id: 'shared', label: 'Shared' },
  ];

  const toggleYear = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  // Filter albums based on tab and search
  const filteredAlbums = useMemo(() => {
    let result = albums.filter((album) => {
      if (activeTab === 'shared' && !album.is_shared) return false;
      if (activeTab === 'owned' && album.is_shared) return false;
      if (searchQuery && !album.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Sort albums
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [albums, activeTab, searchQuery, sortBy]);

  // Group albums
  const groupedAlbums = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Albums': filteredAlbums };
    }

    if (groupBy === 'year') {
      return filteredAlbums.reduce((acc, album) => {
        const year = new Date(album.created_at).getFullYear();
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push(album);
        return acc;
      }, {} as Record<number, Album[]>);
    }

    if (groupBy === 'owner') {
      return filteredAlbums.reduce((acc, album) => {
        const key = album.is_shared ? 'Shared' : 'Owned';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(album);
        return acc;
      }, {} as Record<string, Album[]>);
    }

    return { 'All Albums': filteredAlbums };
  }, [filteredAlbums, groupBy]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  const formatDateRange = (oldest: string | null, newest: string | null) => {
    if (!oldest && !newest) return 'No date range';
    if (!oldest) return formatDate(newest);
    if (!newest) return formatDate(oldest);
    if (formatDate(oldest) === formatDate(newest)) return formatDate(oldest);
    return `${formatDate(oldest)} - ${formatDate(newest)}`;
  };

  const handleCreateAlbum = (data: { name: string; description?: string; photoIds?: number[] }) => {
    createAlbum.mutate(
      { name: data.name, description: data.description, photoIds: data.photoIds },
      {
        onSuccess: (newAlbum) => {
          // Add photos to album if provided
          if (data.photoIds && data.photoIds.length > 0 && newAlbum?.id) {
            addPhotosToAlbum(newAlbum.id, data.photoIds);
          }
          setCreateDialogOpen(false);
        },
      }
    );
  };

  const handleUpdateAlbum = (data: { name: string; description?: string }) => {
    if (!editingAlbum) return;
    updateAlbum.mutate(
      { id: editingAlbum.id, ...data },
      { onSuccess: () => setEditingAlbum(null) }
    );
  };

  const handleDeleteAlbum = () => {
    if (!deletingAlbum) return;
    deleteAlbum.mutate(deletingAlbum.id, {
      onSuccess: () => {
        // Remove all photo relationships for this album
        removeAllPhotosFromAlbum(deletingAlbum.id);
        setDeletingAlbum(null);
      },
    });
  };

  // Get first photo from album as cover image
  const getCoverImage = (album: Album) => {
    // Get all available photos
    const allPhotos = getAllPhotos();
    
    // Get photo IDs for this album
    const photoIds = getAlbumPhotos(album.id);
    
    // Find the first photo in the album
    if (photoIds && photoIds.length > 0) {
      const firstPhotoId = photoIds[0];
      const firstPhoto = allPhotos.find(p => p.id === firstPhotoId);
      if (firstPhoto) {
        return firstPhoto.src;
      }
    }
    
    // Fallback to a solid color background if no photos
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%234f46e5' width='400' height='400'/%3E%3C/svg%3E`;
  };

  return (
    <Layout>
      <div className="space-y-6 bg-immich-bg dark:bg-immich-dark-bg">
        {/* Page Header with Color State */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-immich-fg dark:text-immich-dark-fg">Albums</h1>
          </div>

          {/* Header Controls */}
          {/* <div className="flex items-center gap-3 flex-wrap"> */}
            {/* Create Button - First Priority */}
            {/* <Button style={{ display: 'flex', alignItems: 'center'}} variant="default" size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              <p style={{lineHeight : "normal"}}>Create album</p>
            </Button> */}

            {/* Tabs - Mobile */}
            {/* <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 md:hidden">
              {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={` px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center h-9 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                  backgroundColor: activeTab === tab.id ? '#a855f7' : 'transparent'
                  }}
                  aria-label={`Filter ${tab.label} albums`}
                >
                  {tab.label}
                </button>
              ))}
            </div> */}

            {/* Search */}
            {/* <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search albums"
                className="pl-9 w-48 md:w-64"
                aria-label="Search albums"
              />
            </div> */}

            {/* Sort */}
            {/* <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By date</SelectItem>
                <SelectItem value="name">By name</SelectItem>
                <SelectItem value="recent">Most recent</SelectItem>
              </SelectContent>
            </Select> */}

            {/* Group By */}
            {/* <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupOption)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="year">By year</SelectItem>
                <SelectItem value="owner">By owner</SelectItem>
              </SelectContent>
            </Select> */}
          {/* </div> */}
        </div>

        {/* Tabs - Desktop */}
        {/* <div className="hidden md:flex items-center gap-1 bg-secondary rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-all flex items-center justify-center h-9 ${
                activeTab === tab.id 
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? '#a855f7' : 'transparent'
              }}
              aria-label={`Filter ${tab.label} albums`}
            >
              <div style={{marginTop : "4px"}}>{tab.label}</div>
            </button>
          ))}
        </div> */}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-immich-card dark:bg-immich-dark-gray rounded-xl border border-border overflow-hidden">
                <Skeleton className="w-full aspect-[4/5]" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAlbums.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center py-20">
            <div className="bg-immich-card dark:bg-immich-dark-gray rounded-3xl p-12 text-center max-w-lg border border-border">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="w-16 h-20 bg-muted rounded-lg transform -rotate-12" />
                    <div className="w-16 h-20 bg-muted rounded-lg" />
                    <div className="w-16 h-20 bg-muted rounded-lg transform rotate-12" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-muted-foreground/30 rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'No albums found matching your search'
                  : activeTab === 'shared'
                    ? 'No shared albums yet'
                    : 'Create an album to organize your photos'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  <p style={{lineHeight : ".5"}}>Create album</p>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Albums Grid */
          <div className="space-y-8">
            {Object.entries(groupedAlbums).map(([groupKey, groupAlbums]) => {
              const isYearGroup = groupBy === 'year' && !isNaN(Number(groupKey));
              const year = isYearGroup ? Number(groupKey) : null;
              const isExpanded = year ? expandedYears.includes(year) : true;

              return (
                <div key={groupKey} className="space-y-4">
                  {/* Group Header */}
                  {groupBy !== 'none' && (
                    <button
                      onClick={() => year && toggleYear(year)}
                      className="flex items-center pl-1 gap-2 text-lg font-semibold text-immich-fg dark:text-immich-dark-fg hover:text-immich-primary transition-colors"
                      aria-expanded={isExpanded}
                    >
                      {isYearGroup && (
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            isExpanded ? '' : '-rotate-90'
                          }`}
                        />
                      )}
                      <span>{groupKey}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        ({groupAlbums.length} {groupAlbums.length === 1 ? 'album' : 'albums'})
                      </span>
                    </button>
                  )}

                  {/* Albums Grid */}
                  {isExpanded && (
                    <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5">
                      {/* Create Album Card - Always First */}
                      <div
                        className="group bg-immich-card dark:bg-immich-dark-gray border border-border overflow-hidden hover:border-immich-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => setCreateDialogOpen(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setCreateDialogOpen(true);
                          }
                        }}
                        aria-label="Create new album"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-immich-primary/20 to-immich-primary/5 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-immich-primary/30 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Plus className="w-6 h-6 text-immich-primary" />
                            </div>
                            <p className="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">Create Album</p>
                          </div>
                        </div>
                      </div>

                      {/* Album Cards */}
                      {groupAlbums.map((album) => (
                        <div
                          key={album.id}
                          className="group bg-immich-card dark:bg-immich-dark-gray  border border-border overflow-hidden hover:border-immich-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/albums/${album.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/albums/${album.id}`);
                            }
                          }}
                          aria-label={`Open album ${album.name}`}
                        >
                          {/* Cover Image */}
                          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-immich-primary/20 to-immich-primary/5">
                            <img
                              src={getCoverImage(album)}
                              alt={album.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            
                            {/* Album Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 pl-1 leading-none pt-1 pb-1 text-white">
                              <div className="flex items-center gap-2 mb-1">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-sm font-medium text-white-shadow">
                                  {getPhotoCount(album.id) || album.photo_count || 0} {(getPhotoCount(album.id) || album.photo_count || 0) === 1 ? 'photo' : 'photos'}
                                </span>
                              </div>
                              <div style={{fontSize : "12px"}}>{album.name || '(Untitled)'}</div>
                              {album.is_shared && (
                                <div className="flex items-center gap-1 text-xs text-white/80">
                                  <Users className="w-3 h-3" />
                                  <span>Shared</span>
                                </div>
                              )}
                            </div>

                            {/* Actions Menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                                    aria-label="Album options"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAlbum(album);
                                  }}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingAlbum(album);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Album Details */}
                          {/* <div className="p-4 space-y-2">
                            <h3 className="font-semibold text-immich-fg dark:text-immich-dark-fg line-clamp-1">
                              {album.name || '(Untitled)'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span className="line-clamp-1">
                                {formatDateRange(album.oldest_photo || null, album.most_recent_photo || null)}
                              </span>
                            </div>
                            {album.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {album.description}
                              </p>
                            )}
                          </div> */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Album Dialog */}
      <AlbumDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateAlbum}
        isLoading={createAlbum.isPending}
        mode="create"
      />

      {/* Edit Album Dialog */}
      <AlbumDialog
        open={!!editingAlbum}
        onOpenChange={(open) => !open && setEditingAlbum(null)}
        onSubmit={handleUpdateAlbum}
        initialData={editingAlbum ? { name: editingAlbum.name, description: editingAlbum.description || '' } : undefined}
        isLoading={updateAlbum.isPending}
        mode="edit"
      />

      {/* Delete Album Dialog */}
      <DeleteAlbumDialog
        open={!!deletingAlbum}
        onOpenChange={(open) => !open && setDeletingAlbum(null)}
        onConfirm={handleDeleteAlbum}
        albumName={deletingAlbum?.name || ''}
        isLoading={deleteAlbum.isPending}
      />
    </Layout>
  );
}
