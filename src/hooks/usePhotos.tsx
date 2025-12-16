import { useState, useEffect, useCallback, useRef } from 'react';

export interface Photo {
  id: number;
  date: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isUploaded?: boolean;
  fileSize?: number;
  thumbnail?: string;
  backendId?: string;
}

const DB_NAME = 'PhotoGalleryDB';
const DB_VERSION = 3; // Incremented to force migration
const STORE_NAME = 'photos';
const THUMBNAIL_STORE = 'thumbnails';
const PAGE_SIZE = 50;
const THUMBNAIL_SIZE = 200;

let db: IDBDatabase | null = null;

// ============ DATABASE INITIALIZATION ============
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      console.log('IndexedDB upgrading from version', event.oldVersion, 'to', event.newVersion);
      
      // Create photos store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        console.log('Creating photos store');
        const photoStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        photoStore.createIndex('dateIndex', 'date', { unique: false });
      }

      // Create thumbnails store if it doesn't exist
      if (!database.objectStoreNames.contains(THUMBNAIL_STORE)) {
        console.log('Creating thumbnails store');
        database.createObjectStore(THUMBNAIL_STORE, { keyPath: 'photoId' });
      }
    };

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - close other tabs with this app open');
    };
  });
};

// ============ CLEAR OLD DATA ============
// Clear everything and start fresh (useful for fixing corruption)
const resetDB = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => {
      db = null; // Reset the cached db
      console.log('Database reset successfully');
      resolve();
    };
    deleteRequest.onerror = () => {
      reject(new Error('Failed to reset database'));
    };
  });
};

// ============ THUMBNAIL GENERATION ============
const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        canvas.width = THUMBNAIL_SIZE;
        canvas.height = THUMBNAIL_SIZE;

        const scale = Math.max(THUMBNAIL_SIZE / img.width, THUMBNAIL_SIZE / img.height);
        const x = (THUMBNAIL_SIZE - img.width * scale) / 2;
        const y = (THUMBNAIL_SIZE - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// ============ PAGINATION QUERIES ============
const loadPhotosPaginated = async (offset: number, limit: number): Promise<Photo[]> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allPhotos = request.result as Photo[];
        const sorted = allPhotos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const paginated = sorted.slice(offset, offset + limit);
        resolve(paginated);
      };
      request.onerror = () => {
        console.error('Error getting all photos:', request.error);
        reject(new Error('Failed to load photos'));
      };
      
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed'));
      };
    });
  } catch (error) {
    console.error('Error loading paginated photos:', error);
    return [];
  }
};

const getPhotoCount = async (): Promise<number> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('Error counting photos:', request.error);
        reject(new Error('Failed to get count'));
      };
    });
  } catch (error) {
    return 0;
  }
};

const loadPhotosFromDB = async (): Promise<Photo[]> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Error loading photos:', request.error);
        reject(new Error('Failed to load photos'));
      };
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Error loading photos from IndexedDB:', error);
    return [];
  }
};

// ============ DATABASE OPERATIONS ============
const savePhotoDB = async (photo: Photo, thumbnail?: string): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, THUMBNAIL_STORE], 'readwrite');

      transaction.onerror = () => {
        console.error('Transaction error during save:', transaction.error);
        reject(new Error('Failed to save photo - transaction error'));
      };

      transaction.oncomplete = () => {
        console.log('Photo saved successfully:', photo.id);
        resolve();
      };

      try {
        const photoStore = transaction.objectStore(STORE_NAME);
        photoStore.add(photo);

        if (thumbnail) {
          const thumbStore = transaction.objectStore(THUMBNAIL_STORE);
          thumbStore.add({ photoId: photo.id, data: thumbnail });
        }
      } catch (error) {
        console.error('Error adding to object store:', error);
        reject(new Error('Failed to add photo to store'));
      }
    });
  } catch (error) {
    console.error('Error saving photo to IndexedDB:', error);
    throw error;
  }
};

const deletePhotoDB = async (id: number): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, THUMBNAIL_STORE], 'readwrite');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Transaction error during delete:', transaction.error);
        reject(new Error('Failed to delete photo'));
      };

      const photoStore = transaction.objectStore(STORE_NAME);
      photoStore.delete(id);

      const thumbStore = transaction.objectStore(THUMBNAIL_STORE);
      thumbStore.delete(id);
    });
  } catch (error) {
    console.error('Error deleting photo from IndexedDB:', error);
    throw error;
  }
};

const clearPhotosDB = async (): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, THUMBNAIL_STORE], 'readwrite');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Transaction error during clear:', transaction.error);
        reject(new Error('Failed to clear photos'));
      };

      const photoStore = transaction.objectStore(STORE_NAME);
      photoStore.clear();

      const thumbStore = transaction.objectStore(THUMBNAIL_STORE);
      thumbStore.clear();
    });
  } catch (error) {
    console.error('Error clearing photos from IndexedDB:', error);
    throw error;
  }
};

// ============ HOOK IMPLEMENTATION ============
export function usePhotos() {
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        const count = await getPhotoCount();
        setTotalCount(count);

        const initial = await loadPhotosPaginated(0, PAGE_SIZE);
        setUploadedPhotos(initial);
        setCurrentPage(0);
        setHasMore(PAGE_SIZE < count);
      } catch (error) {
        console.error('Error initializing photos:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || isLoading) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * PAGE_SIZE;

      const newPhotos = await loadPhotosPaginated(offset, PAGE_SIZE);

      if (newPhotos.length > 0) {
        setUploadedPhotos((prev) => [...prev, ...newPhotos]);
        setCurrentPage(nextPage);
        setHasMore(offset + PAGE_SIZE < totalCount);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more photos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load more photos');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, totalCount, hasMore, isLoading]);

  const setObserverTarget = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(element);
  }, [hasMore, isLoading, loadMore]);

  const uploadPhoto = async (file: File): Promise<Photo> => {
    return new Promise((resolve, reject) => {
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > 500) {
        reject(new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum of 500MB`));
        return;
      }

      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };

      reader.onload = async (e) => {
        const result = e.target?.result as string;

        const img = new Image();
        img.onload = async () => {
          try {
            const thumbnail = await generateThumbnail(file);

            const newPhoto: Photo = {
              id: Date.now() + Math.random(),
              date: new Date().toISOString(),
              src: result,
              alt: file.name,
              width: img.width,
              height: img.height,
              fileSize: file.size,
              isUploaded: true,
              thumbnail,
            };

            // Save to IndexedDB
            await savePhotoDB(newPhoto, thumbnail);
            
            setUploadedPhotos((prev) => [newPhoto, ...prev]);
            setTotalCount((prev) => prev + 1);
            setUploadProgress(0);
            setError(null);
            resolve(newPhoto);
          } catch (error) {
            setUploadProgress(0);
            const errorMsg = error instanceof Error ? error.message : 'Upload failed';
            setError(errorMsg);
            reject(error);
          }
        };

        img.onerror = () => {
          setUploadProgress(0);
          setError('Invalid image file');
          reject(new Error('Failed to load image'));
        };
        img.src = result;
      };

      reader.onerror = () => {
        setUploadProgress(0);
        setError('Failed to read file');
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const uploadMultiplePhotos = async (files: FileList | File[]): Promise<Photo[]> => {
    const fileArray = Array.from(files);
    const results: Photo[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      try {
        const photo = await uploadPhoto(fileArray[i]);
        results.push(photo);
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      } catch (error) {
        console.error(`Error uploading ${fileArray[i].name}:`, error);
        throw error;
      }
    }

    setUploadProgress(0);
    return results;
  };

  const deletePhoto = async (id: number) => {
    try {
      await deletePhotoDB(id);
      const updated = uploadedPhotos.filter((p) => p.id !== id);
      setUploadedPhotos(updated);
      setTotalCount((prev) => prev - 1);
      setError(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Delete failed';
      setError(errorMsg);
      throw error;
    }
  };

  const getAllPhotos = (): Photo[] => {
    return uploadedPhotos;
  };

  const clearAllPhotos = async () => {
    try {
      await clearPhotosDB();
      setUploadedPhotos([]);
      setTotalCount(0);
      setCurrentPage(0);
      setHasMore(true);
      setError(null);
    } catch (error) {
      console.error('Error clearing photos:', error);
      const errorMsg = error instanceof Error ? error.message : 'Clear failed';
      setError(errorMsg);
      throw error;
    }
  };

  // Emergency reset function
  const hardReset = async () => {
    try {
      await resetDB();
      setUploadedPhotos([]);
      setTotalCount(0);
      setCurrentPage(0);
      setHasMore(true);
      setError(null);
      setIsInitialized(false);
      // Reinitialize
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error during hard reset:', error);
      setError('Hard reset failed');
    }
  };

  return {
    uploadedPhotos,
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    getAllPhotos,
    clearAllPhotos,
    uploadProgress,
    isInitialized,
    totalCount,
    currentPage,
    isLoading,
    hasMore,
    loadMore,
    setObserverTarget,
    error,
    hardReset, // Emergency function
  };
}

