// Store album-photo relationships in localStorage
const STORAGE_KEY = 'album_photos';

export interface AlbumPhoto {
  albumId: string;
  photoId: number;
  addedAt: string;
}

const loadAlbumPhotos = (): AlbumPhoto[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading album photos:', error);
  }
  return [];
};

const saveAlbumPhotos = (albumPhotos: AlbumPhoto[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(albumPhotos));
  } catch (error) {
    console.error('Error saving album photos:', error);
  }
};

export function useAlbumPhotos() {
  const addPhotosToAlbum = (albumId: string, photoIds: number[]) => {
    const existing = loadAlbumPhotos();
    const now = new Date().toISOString();
    
    // Remove existing photos for this album
    const filtered = existing.filter(ap => ap.albumId !== albumId);
    
    // Add new photos
    const newPhotos: AlbumPhoto[] = photoIds.map(photoId => ({
      albumId,
      photoId,
      addedAt: now,
    }));
    
    saveAlbumPhotos([...filtered, ...newPhotos]);
  };

  const getAlbumPhotos = (albumId: string): number[] => {
    const all = loadAlbumPhotos();
    return all
      .filter(ap => ap.albumId === albumId)
      .map(ap => ap.photoId);
  };

  const removePhotoFromAlbum = (albumId: string, photoId: number) => {
    const existing = loadAlbumPhotos();
    const filtered = existing.filter(
      ap => !(ap.albumId === albumId && ap.photoId === photoId)
    );
    saveAlbumPhotos(filtered);
  };

  const removeAllPhotosFromAlbum = (albumId: string) => {
    const existing = loadAlbumPhotos();
    const filtered = existing.filter(ap => ap.albumId !== albumId);
    saveAlbumPhotos(filtered);
  };

  const getPhotoCount = (albumId: string): number => {
    return getAlbumPhotos(albumId).length;
  };

  return {
    addPhotosToAlbum,
    getAlbumPhotos,
    removePhotoFromAlbum,
    removeAllPhotosFromAlbum,
    getPhotoCount,
  };
}

