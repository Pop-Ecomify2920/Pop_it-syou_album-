import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useAlbumsLocal } from '@/hooks/useAlbumsLocal';
import { useAlbumPhotos } from '@/hooks/useAlbumPhotos';
import { usePhotos } from '@/hooks/usePhotos';
import { PhotoViewer } from '@/components/PhotoViewer';

interface Photo {
  id: number;
  date: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { albums } = useAlbumsLocal();
  const { getAlbumPhotos, getPhotoCount } = useAlbumPhotos();
  const { getAllPhotos } = usePhotos();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

  // Find the album
  const album = useMemo(() => {
    return albums.find(a => a.id === albumId);
  }, [albums, albumId]);

  // Get all photos and filter by album
  const allPhotos = useMemo(() => {
    if (!album) return [];
    
    const allAvailablePhotos = getAllPhotos();
    const albumPhotoIds = getAlbumPhotos(album.id);
    
    return allAvailablePhotos.filter(photo => 
      albumPhotoIds.includes(photo.id)
    );
  }, [album, getAllPhotos, getAlbumPhotos]);

  const handlePhotoClick = (photoId: number) => {
    const index = allPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setCurrentPhotoIndex(index);
      setViewerOpen(true);
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotos(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  if (!album) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center bg-immich-bg dark:bg-immich-dark-bg">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
              Album not found
            </h2>
            <p className="text-muted-foreground mb-6">The album you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/albums')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Albums
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col bg-immich-bg dark:bg-immich-dark-bg">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/albums')}
              className="text-immich-fg dark:text-immich-dark-fg hover:bg-immich-primary/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-immich-fg dark:text-immich-dark-fg">
                {album.name || '(Untitled)'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {getPhotoCount(album.id)} {getPhotoCount(album.id) === 1 ? 'photo' : 'photos'}
              </p>
            </div>
          </div>
          {album.description && (
            <p className="text-muted-foreground pl-14">
              {album.description}
            </p>
          )}
        </div>

        {/* Content */}
        {allPhotos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="bg-immich-card dark:bg-immich-dark-gray rounded-3xl p-12 text-center max-w-lg border border-border">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
                No photos in this album
              </h2>
              <p className="text-muted-foreground mb-6">
                Add photos to this album to see them here.
              </p>
              <Button onClick={() => navigate('/albums')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Albums
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              {/* Photo Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
                {allPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer overflow-hidden aspect-[4/5]"
                    onClick={() => handlePhotoClick(photo.id)}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x375?text=Photo+${photo.id}`;
                      }}
                    />
                    
                    {/* Selection overlay */}
                    <div className={`absolute inset-0 transition-all duration-200 ${
                      selectedPhotos.includes(photo.id)
                        ? 'bg-immich-primary/30 ring-2 ring-immich-primary ring-inset'
                        : 'bg-black/0 group-hover:bg-black/20'
                    }`} />
                    
                    {/* Selection checkbox */}
                    <div 
                      className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center z-10 ${
                        selectedPhotos.includes(photo.id)
                          ? 'bg-immich-primary border-immich-primary'
                          : 'border-white/70 opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => toggleSelect(photo.id, e)}
                      role="checkbox"
                      aria-checked={selectedPhotos.includes(photo.id)}
                      tabIndex={0}
                      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSelect(photo.id, e as unknown as React.MouseEvent);
                        }
                      }}
                    >
                      {selectedPhotos.includes(photo.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewer
        photos={allPhotos}
        currentIndex={currentPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onNavigate={setCurrentPhotoIndex}
      />
    </Layout>
  );
}
