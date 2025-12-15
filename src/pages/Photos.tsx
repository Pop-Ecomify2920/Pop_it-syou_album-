import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { PhotoViewer } from '@/components/PhotoViewer';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles } from 'lucide-react';
import { usePhotos, Photo as PhotoType } from '@/hooks/usePhotos';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Valid Unsplash image IDs for demonstration
const unsplashImageIds = [
  '1506905925346-21bda4d32df4', // Mountain landscape
  '1469474968028-56623f02e42e', // Nature scene
  '1447752875215-b2761acb3c5d', // Forest path
  '1433086966358-54859d0ed716', // Waterfall
  '1501854140801-50d01698950b', // Green hills
  '1472214103451-9374bd1c798e', // Valley view
  '1465146344425-f00d5f5c8f07', // Flowers
  '1426604966848-d7adac402bff', // Lake reflection
  '1470071459604-3b5ec3a7fe05', // Foggy mountains
  // '1441974231531-c6227db76b6e', // Sunlit forest
  '1519681393784-d120267933ba', // Mountain peak
  '1501594907352-04cda38ebc29', // Desert
  '1519904981062-0a3b74f88edf', // Ocean
  '1506905925346-21bda4d32df4', // Landscape
  '1469474968028-56623f02e42e', // Nature
  '1447752875215-b2761acb3c5d', // Forest
  '1433086966358-54859d0ed716', // Water
  // '1501854140801-50d01698950b', // Hills
  // '1472214103451-9374bd1c798e', // Valley
  // '1465146344425-f00d5f5c8f07', // Garden
  // '1426604966848-d7adac402bff', // Lake
  // '1470071459604-3b5ec3a7fe05', // Mountains
  // '1441974231531-c6227db76b6e', // Trees
  // '1519681393784-d120267933ba', // Peak
  // '1501594907352-04cda38ebc29', // Sand
  // '1519904981062-0a3b74f88edf', // Waves
  // '1506905925346-21bda4d32df4', // Scenery
  // '1469474968028-56623f02e42e', // Landscape
  // '1447752875215-b2761acb3c5d', // Path
  // '1433086966358-54859d0ed716', // Stream
];

// Mock photo data - expanded for better demonstration
const generateMockPhotos = () => {
  const dates = ['Today', 'Wednesday', 'Sunday', 'Saturday', 'Friday', 'Thursday', 'Tuesday', 'Monday'];
  const photos = [];
  let id = 1;
  let imageIndex = 0;
  
  dates.forEach((date, dateIdx) => {
    const count = date === 'Today' ? 8 : Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < count; i++) {
      const imageId = unsplashImageIds[imageIndex % unsplashImageIds.length];
      photos.push({
        id: id++,
        date,
        src: `https://images.unsplash.com/photo-${imageId}?w=1200&h=900&fit=crop&q=95`,
        alt: `Photo ${id} - ${date}`,
        width: 400 + Math.random() * 200,
        height: 300 + Math.random() * 300,
      });
      imageIndex++;
    }
  });
  
  return photos;
};

const mockPhotos = generateMockPhotos();

interface Photo {
  id: number;
  date: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isUploaded?: boolean;
}

export default function Photos() {
  const { uploadedPhotos, uploadMultiplePhotos } = usePhotos();
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [showMemoryLane, setShowMemoryLane] = useState(true);
  const [visibleDates, setVisibleDates] = useState<Set<string>>(new Set());
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Combine uploaded photos with mock photos
  // Uploaded photos go to "Today" group, mock photos keep their dates
  const allPhotos = useMemo(() => {
    const uploaded = uploadedPhotos.map(photo => ({
      ...photo,
      date: 'Today', // Always put uploaded photos in Today
    }));
    
    // Combine: uploaded photos first (in Today), then mock photos
    return [...uploaded, ...mockPhotos];
  }, [uploadedPhotos]);

  // Group photos by date
  const groupedPhotos = useMemo(() => {
    return allPhotos.reduce<Record<string, Photo[]>>((acc, photo) => {
      if (!acc[photo.date]) {
        acc[photo.date] = [];
      }
      acc[photo.date].push(photo);
      return acc;
    }, {});
  }, [allPhotos]);

  // Virtual scrolling with intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const date = entry.target.getAttribute('data-date');
          if (date) {
            setVisibleDates((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(date);
              } else {
                next.delete(date);
              }
              return next;
            });
          }
        });
      },
      { rootMargin: '200px' }
    );

    dateRefs.current.forEach((element) => {
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const setDateRef = useCallback((date: string, element: HTMLDivElement | null) => {
    if (element) {
      dateRefs.current.set(date, element);
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      dateRefs.current.delete(date);
    }
  }, []);

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotos(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
    setLastSelectedIndex(allPhotos.findIndex(p => p.id === id));
  };

  const handlePhotoClick = (photoId: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const currentIndex = allPhotos.findIndex(p => p.id === photoId);
      const start = Math.min(currentIndex, lastSelectedIndex);
      const end = Math.max(currentIndex, lastSelectedIndex);
      const rangeIds = allPhotos.slice(start, end + 1).map(p => p.id);
      setSelectedPhotos(prev => {
        const newSelection = new Set(prev);
        rangeIds.forEach(id => newSelection.add(id));
        return Array.from(newSelection);
      });
      setLastSelectedIndex(currentIndex);
    } else {
      // Regular click: open viewer
      openViewer(photoId);
    }
  };

  const openViewer = (photoId: number) => {
    const index = allPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setCurrentPhotoIndex(index);
      setViewerOpen(true);
    }
  };

  // Calculate justified layout (masonry-style)
  const renderJustifiedRow = (photos: Photo[], rowHeight: number = 200) => {
    return (
      <div className="flex gap-1 mb-1" style={{ height: `${rowHeight}px` }}>
        {photos.map((photo) => {
          const aspectRatio = (photo.width || 400) / (photo.height || 300);
          const width = rowHeight * aspectRatio;
          return (
            <div
              key={photo.id}
              className="relative group cursor-pointer overflow-hidden rounded-lg"
              style={{ width: `${width}px`, height: `${rowHeight}px` }}
              onClick={(e) => handlePhotoClick(photo.id, e)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/${photo.width || 400}x${photo.height || 300}?text=Photo+${photo.id}`;
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
                className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center z-10 ${
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
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Simple grid layout for now (justified layout would need more complex calculations)
  const renderPhotoGrid = (photos: Photo[]) => {
    // Group photos into rows for justified layout effect
    const rows: Photo[][] = [];
    let currentRow: Photo[] = [];
    let currentRowWidth = 0;
    const targetRowHeight = 200;
    const containerWidth = 1200; // Approximate container width

    photos.forEach((photo) => {
      const aspectRatio = (photo.width || 400) / (photo.height || 300);
      const photoWidth = targetRowHeight * aspectRatio;
      
      if (currentRowWidth + photoWidth > containerWidth && currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [photo];
        currentRowWidth = photoWidth;
      } else {
        currentRow.push(photo);
        currentRowWidth += photoWidth + 4; // 4px gap
      }
    });
    
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return (
      <div className="space-y-1">
        {rows.map((row, rowIdx) => renderJustifiedRow(row, targetRowHeight))}
      </div>
    );
  };

  const hasPhotos = allPhotos.length > 0;

  return (
    <Layout>
      <div className="h-full flex flex-col bg-immich-bg dark:bg-immich-dark-bg">
        {/* Memory Lane Widget */}
        {showMemoryLane && hasPhotos && (
          <div className="mb-6 p-4 bg-immich-card dark:bg-immich-dark-gray rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-immich-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-immich-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-immich-fg dark:text-immich-dark-fg">Memory Lane</h3>
                  <p className="text-sm text-muted-foreground">Photos from this day in previous years</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMemoryLane(false)}
                aria-label="Hide Memory Lane"
              >
                Hide
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!hasPhotos ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="bg-immich-card dark:bg-immich-dark-gray rounded-3xl p-12 text-center max-w-lg border border-border">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-2">
                No photos yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Upload your first photo to get started
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  
                  const imageFiles = Array.from(files).filter(file => 
                    file.type.startsWith('image/')
                  );
                  
                  if (imageFiles.length > 0) {
                    try {
                      toast.loading(`Uploading ${imageFiles.length} photo(s)...`);
                      await uploadMultiplePhotos(imageFiles);
                      toast.success(`Successfully uploaded ${imageFiles.length} photo(s)!`);
                    } catch (error) {
                      toast.error('Failed to upload photos: ' + (error instanceof Error ? error.message : 'Unknown error'));
                    }
                  } else {
                    toast.error('Please select image files only');
                  }
                  
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                aria-label="Upload photos"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="upload" style={{ backgroundColor: '#3eb3da' }}>
                <Upload className="w-4 h-4 mr-2" />
                Upload photos
              </Button>
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex gap-4 overflow-hidden relative ${isMobile ? 'flex-col' : ''}`}>
            {/* Main Content Area */}
            <div ref={contentRef} className={`flex-1 overflow-auto scrollbar-hidden res-gallery ${isMobile ? 'w-full' : ''}`}>
              <div className="">
                {/* Year indicator - Only show on desktop */}
                {!isMobile && (
                  <div className="flex justify-end sticky top-0 z-10 bg-immich-bg dark:bg-immich-dark-bg py-2">
                    <span className="text-sm text-immich-primary font-medium px-3 py-1 rounded border border-immich-primary/30 bg-immich-card dark:bg-immich-dark-gray">
                      2025
                    </span>
                  </div>
                )}

                {/* Photo Groups with Virtual Scrolling */}
                {Object.entries(groupedPhotos).map(([date, photos]) => (
                  <div
                    key={date}
                    ref={(el) => setDateRef(date, el)}
                    data-date={date}
                    className="space-y-3"
                  >
                    {/* Date Header */}
                    <h2 className="text-lg font-semibold pl-4 text-immich-fg dark:text-immich-dark-fg sticky top-0 z-10 bg-immich-bg dark:bg-immich-dark-bg py-2">
                      {date}
                    </h2>
                    
                    {/* Photo Grid - Responsive */}
                    {isMobile ? renderPhotoGridMobile(photos) : renderPhotoGrid(photos)}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Slider - Right Side (Hidden on Mobile) */}
            {!isMobile && (
              <div className="relative w-16 flex flex-col items-center justify-between py-8 px-2 bg-immich-card dark:bg-immich-dark-gray border-l border-border">
                {/* Timeline track background */}
                <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full" />
                
                {/* Month/Year indicators - visible on hover */}
                <div className="absolute right-0 top-0 bottom-0 w-32 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto flex flex-col justify-between py-8 z-50">
                  {Object.entries(groupedPhotos).map(([date, _], index) => {
                    const percentage = (index / (Object.keys(groupedPhotos).length - 1 || 1)) * 100;
                    return (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDateIndex(index);
                          const element = dateRefs.current.get(date);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="absolute right-0 px-3 py-1.5 bg-immich-bg dark:bg-immich-dark-gray rounded-lg border border-immich-primary/40 text-xs font-semibold text-immich-primary whitespace-nowrap hover:bg-immich-primary hover:text-white transition-all cursor-pointer z-50"
                        style={{
                          top: `${percentage}%`,
                          transform: 'translateY(-50%)',
                        }}
                        aria-label={`Jump to ${date}`}
                      >
                        {date.includes('2025') ? date : `${date} 2025`}
                      </button>
                    );
                  })}
                </div>

                {/* Slider Track */}
                <div className="flex-1 flex flex-col items-center justify-between h-full relative">
                  {/* Interactive vertical slider */}
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, Object.keys(groupedPhotos).length - 1)}
                    value={selectedDateIndex}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      setSelectedDateIndex(index);
                      
                      // Scroll to selected date
                      const dateKeys = Object.keys(groupedPhotos);
                      if (dateKeys[index]) {
                        const element = dateRefs.current.get(dateKeys[index]);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ writingMode: 'vertical-rl' } as React.CSSProperties}
                    aria-label="Timeline slider"
                  />

                  {/* Slider indicator dot */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full pointer-events-none transition-all duration-150 z-20"
                    style={{
                      top: `${(selectedDateIndex / (Object.keys(groupedPhotos).length - 1 || 1)) * 100}%`,
                      boxShadow: '0 0 10px rgba(14, 165, 233, 0.8), 0 0 20px rgba(168, 85, 247, 0.4)',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />

                  {/* Slider indicator line */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-500 pointer-events-none transition-all duration-150 z-20"
                    style={{
                      top: `${(selectedDateIndex / (Object.keys(groupedPhotos).length - 1 || 1)) * 100}%`,
                      boxShadow: '0 0 8px rgba(14, 165, 233, 0.6)',
                    }}
                  />
                </div>

                {/* Static Year Label at Top */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-immich-primary pointer-events-none">
                  2025
                </div>

                {/* Current Date Display at Bottom - visible on hover */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-immich-bg dark:bg-immich-dark-gray rounded-lg border border-immich-primary/30 text-xs font-semibold text-immich-primary whitespace-nowrap opacity-0 group-hover:opacity-0 transition-opacity">
                  {Object.keys(groupedPhotos)[selectedDateIndex] || 'Today'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selection Mode Indicator */}
        {selectedPhotos.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-immich-card dark:bg-immich-dark-gray rounded-full px-6 py-3 shadow-lg border border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
                {selectedPhotos.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  Download
                </Button>
                <Button variant="ghost" size="sm">
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPhotos([])}
                  aria-label="Clear selection"
                >
                  Clear
                </Button>
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

  // Mobile-optimized grid layout
  function renderPhotoGridMobile(photos: Photo[]) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer overflow-hidden rounded-sm aspect-[4/5]"
            onClick={(e) => handlePhotoClick(photo.id, e)}
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
              className={`absolute top-1 left-1 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center z-10 ${
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
    );
  }
}
