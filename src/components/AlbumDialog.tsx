import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { usePhotos } from '@/hooks/usePhotos';
import { Photo } from '@/hooks/usePhotos';

interface AlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; photoIds?: number[] }) => void;
  initialData?: { name: string; description?: string };
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function AlbumDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
  mode,
}: AlbumDialogProps) {
  const [step, setStep] = useState<'info' | 'photos'>('info');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const { getAllPhotos } = usePhotos();
  const allPhotos = getAllPhotos();

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setSelectedPhotoIds([]);
      setStep('info');
    }
  }, [open, initialData]);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (mode === 'create') {
      // Move to photo selection step
      setStep('photos');
    } else {
      // Edit mode: submit directly
      onSubmit({ name: name.trim(), description: description.trim() || undefined });
    }
  };

  const handlePhotoToggle = (photoId: number) => {
    setSelectedPhotoIds(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleDone = () => {
    if (mode === 'create') {
      onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        photoIds: selectedPhotoIds,
      });
    }
  };

  const handleBack = () => {
    setStep('info');
  };

  const handleCancel = () => {
    setStep('info');
    setSelectedPhotoIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' 
              ? step === 'info' 
                ? 'Create New Album' 
                : 'Select Photos'
              : 'Edit Album'}
          </DialogTitle>
        </DialogHeader>

        {step === 'info' ? (
          <form onSubmit={handleInfoSubmit} className="space-y-4 flex-1 overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Album Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter album name"
                // autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter album description"
                rows={3}
              />
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-1 sm:gap-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="mt-[10px] sm:mt-0"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || isLoading}>
                {mode === 'create' ? 'Next: Select Photos' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Photo Selection Grid */}
            <div className="flex-1 overflow-auto mb-4">
              {allPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-4">No photos available</p>
                  <p className="text-sm text-muted-foreground">
                    Upload some photos first to add them to albums
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {allPhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`relative aspect-square group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-immich-primary ring-2 ring-immich-primary/50'
                            : 'border-transparent hover:border-immich-primary/50'
                        }`}
                        onClick={() => handlePhotoToggle(photo.id)}
                      >
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        {/* Selection overlay */}
                        <div
                          className={`absolute inset-0 transition-all ${
                            isSelected
                              ? 'bg-immich-primary/30'
                              : 'bg-black/0 group-hover:bg-black/20'
                          }`}
                        />
                        
                        {/* Checkbox indicator */}
                        <div
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-immich-primary border-immich-primary'
                              : 'bg-white/80 border-white/80 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selection count and actions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''} selected
                </p>
                {selectedPhotoIds.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPhotoIds([])}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
              
              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="mt-[15px] sm:mt-0"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDone}
                  disabled={isLoading || selectedPhotoIds.length === 0}
                >
                  {isLoading ? 'Creating...' : 'Done'}
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
