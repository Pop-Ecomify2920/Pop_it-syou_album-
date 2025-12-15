import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Info,
  Download,
  Heart,
  Share2
} from 'lucide-react';

interface Photo {
  id: number;
  date: string;
  src: string;
  alt: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// Optimize image URL - use smaller size for faster loading
const getOptimizedImageUrl = (originalUrl: string, quality: 'thumb' | 'display' | 'full'): string => {
  const baseUrl = originalUrl.split('?')[0];
  const params = new URLSearchParams(originalUrl.split('?')[1] || '');
  
  switch (quality) {
    case 'thumb':
      return `${baseUrl}?w=800&h=600&fit=crop&q=80`; // Fast thumbnail
    case 'display':
      return `${baseUrl}?w=1600&h=1200&fit=crop&q=90`; // Display size
    case 'full':
      return `${baseUrl}?w=2560&h=1920&fit=crop&q=95`; // Full quality (only when zoomed)
  }
};

// Image preloader component
const useImagePreloader = (photos: Photo[], currentIndex: number) => {
  const preloadedImages = useRef<{ [key: number]: HTMLImageElement }>({});

  useEffect(() => {
    // Preload current, next, and previous images
    const indicesToPreload = [
      currentIndex - 1,
      currentIndex,
      currentIndex + 1
    ].filter(i => i >= 0 && i < photos.length);

    indicesToPreload.forEach(index => {
      if (!preloadedImages.current[index]) {
        const img = new Image();
        img.src = getOptimizedImageUrl(photos[index].src, 'display');
        preloadedImages.current[index] = img;
      }
    });
  }, [currentIndex, photos]);
};

export function PhotoViewer({ photos, currentIndex, isOpen, onClose, onNavigate }: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageQuality, setImageQuality] = useState<'thumb' | 'display'>('display');

  // Preload images for faster navigation
  useImagePreloader(photos, currentIndex);

  const currentPhoto = useMemo(() => photos[currentIndex], [photos, currentIndex]);
  const optimizedImageUrl = useMemo(
    () => getOptimizedImageUrl(currentPhoto?.src || '', imageQuality),
    [currentPhoto, imageQuality]
  );

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      resetTransforms();
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
      resetTransforms();
    }
  }, [currentIndex, photos.length, onNavigate]);

  const resetTransforms = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setImageQuality('display');
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.5, 4);
      // Load full quality when zoomed in
      if (newZoom > 1.5 && imageQuality !== 'full') {
        setImageQuality('full');
      }
      return newZoom;
    });
  }, [imageQuality]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowDetails(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose, handleZoomIn, handleZoomOut]);

  // Reset on photo change
  useEffect(() => {
    resetTransforms();
    setIsLiked(false);
  }, [currentIndex, resetTransforms]);

  if (!currentPhoto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95 border-none">
        {/* Top toolbar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-white/70 text-sm">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className={`h-5 w-5 ${showDetails ? 'text-primary' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main image container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
          <img
            key={`photo-${currentIndex}`}
            src={optimizedImageUrl}
            alt={currentPhoto.alt}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: zoom === 1 ? 'transform 0.2s ease-out' : 'none',
              willChange: 'transform',
            }}
            draggable={false}
            loading="eager"
            decoding="async"
          />

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white transition-all pointer-events-auto"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {currentIndex < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white transition-all pointer-events-auto"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>

        {/* Bottom toolbar - Zoom controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-white/70 text-sm min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Details overlay */}
        {showDetails && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/80 backdrop-blur-md p-6 pt-20 border-l border-white/10">
            <h3 className="text-white font-semibold text-lg mb-4">Details</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-white/50 text-sm">Title</span>
                <p className="text-white">{currentPhoto.alt}</p>
              </div>
              
              <div>
                <span className="text-white/50 text-sm">Date</span>
                <p className="text-white">{currentPhoto.date}</p>
              </div>
              
              <div>
                <span className="text-white/50 text-sm">Dimensions</span>
                <p className="text-white">1920 × 1280</p>
              </div>
              
              <div>
                <span className="text-white/50 text-sm">File size</span>
                <p className="text-white">2.4 MB</p>
              </div>
              
              <div>
                <span className="text-white/50 text-sm">Camera</span>
                <p className="text-white">iPhone 15 Pro</p>
              </div>
              
              <div>
                <span className="text-white/50 text-sm">Location</span>
                <p className="text-white">San Francisco, CA</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-white/50 text-sm">Keyboard shortcuts</span>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Previous/Next</span>
                  <span>← →</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Zoom in/out</span>
                  <span>+ −</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Toggle info</span>
                  <span>I</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Close</span>
                  <span>Esc</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
