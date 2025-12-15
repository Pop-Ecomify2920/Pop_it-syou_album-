import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_photo_id: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  photo_count?: number;
  most_recent_photo?: string | null;
  oldest_photo?: string | null;
}

const STORAGE_KEY = 'local_albums';

const loadAlbums = (): Album[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading albums:', error);
  }
  return [];
};

const saveAlbums = (albums: Album[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
  } catch (error) {
    console.error('Error saving albums:', error);
  }
};

export function useAlbumsLocal() {
  const [albums, setAlbums] = useState<Album[]>(loadAlbums());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAlbums(loadAlbums());
  }, []);

  // Sync albums whenever they change in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setAlbums(loadAlbums());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createAlbum = (data: { name: string; description?: string; photoIds?: number[] }) => {
    return new Promise<Album & { photoIds?: number[] }>((resolve, reject) => {
      setIsLoading(true);
      try {
        const newAlbum: Album = {
          id: `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          description: data.description || null,
          cover_photo_id: data.photoIds && data.photoIds.length > 0 ? String(data.photoIds[0]) : null,
          is_shared: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'local_user',
          photo_count: data.photoIds?.length || 0,
        };

        const updated = [...albums, newAlbum];
        setAlbums(updated);
        saveAlbums(updated);

        setIsLoading(false);
        resolve({ ...newAlbum, photoIds: data.photoIds });
      } catch (error) {
        setIsLoading(false);
        reject(error);
      }
    });
  };

  const updateAlbum = (data: { id: string; name: string; description?: string }) => {
    return new Promise<Album | undefined>((resolve, reject) => {
      setIsLoading(true);
      try {
        const updated = albums.map(album =>
          album.id === data.id
            ? { ...album, name: data.name, description: data.description || null, updated_at: new Date().toISOString() }
            : album
        );
        setAlbums(updated);
        saveAlbums(updated);
        setIsLoading(false);
        resolve(updated.find(a => a.id === data.id));
      } catch (error) {
        setIsLoading(false);
        reject(error);
      }
    });
  };

  const deleteAlbum = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      setIsLoading(true);
      try {
        const updated = albums.filter(album => album.id !== id);
        setAlbums(updated);
        saveAlbums(updated);
        setIsLoading(false);
        resolve();
      } catch (error) {
        setIsLoading(false);
        reject(error);
      }
    });
  };

  return {
    albums,
    isLoading,
    error: null,
    createAlbum: {
      mutate: (data: { name: string; description?: string; photoIds?: number[] }, options?: { onSuccess?: (album: Album & { photoIds?: number[] }) => void; onError?: (error: Error) => void }) => {
        createAlbum(data)
          .then((result) => {
            toast.success('Album created successfully');
            options?.onSuccess?.(result);
          })
          .catch((error: Error) => {
            toast.error('Failed to create album: ' + (error.message || 'Unknown error'));
            options?.onError?.(error);
          });
      },
      isPending: isLoading,
    },
    updateAlbum: {
      mutate: (data: { id: string; name: string; description?: string }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
        updateAlbum(data)
          .then(() => {
            toast.success('Album updated successfully');
            options?.onSuccess?.();
          })
          .catch((error: Error) => {
            toast.error('Failed to update album: ' + (error.message || 'Unknown error'));
            options?.onError?.(error);
          });
      },
      isPending: isLoading,
    },
    deleteAlbum: {
      mutate: (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
        deleteAlbum(id)
          .then(() => {
            toast.success('Album deleted successfully');
            options?.onSuccess?.();
          })
          .catch((error: Error) => {
            toast.error('Failed to delete album: ' + (error.message || 'Unknown error'));
            options?.onError?.(error);
          });
      },
      isPending: isLoading,
    },
  };
}

