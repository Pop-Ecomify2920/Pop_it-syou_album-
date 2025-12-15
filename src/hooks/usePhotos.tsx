import { useState, useEffect } from 'react';

export interface Photo {
  id: number;
  date: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isUploaded?: boolean;
  fileSize?: number;
}

const DB_NAME = 'PhotoGalleryDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let db: IDBDatabase | null = null;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Load photos from IndexedDB
const loadPhotosFromDB = async (): Promise<Photo[]> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to load photos'));
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Error loading photos from IndexedDB:', error);
    return [];
  }
};

// Save photo to IndexedDB
const savePhotoDB = async (photo: Photo): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(photo);

      request.onerror = () => reject(new Error('Failed to save photo'));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error saving photo to IndexedDB:', error);
    throw error;
  }
};

// Delete photo from IndexedDB
const deletePhotoDB = async (id: number): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete photo'));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error deleting photo from IndexedDB:', error);
    throw error;
  }
};

// Clear all photos from IndexedDB
const clearPhotosDB = async (): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear photos'));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error clearing photos from IndexedDB:', error);
    throw error;
  }
};

export function usePhotos() {
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    loadPhotosFromDB().then((photos) => {
      setUploadedPhotos(photos);
      setIsInitialized(true);
    });
  }, []);

  const uploadPhoto = async (file: File): Promise<Photo> => {
    return new Promise((resolve, reject) => {
      // Check file size before processing
      const fileSizeMB = file.size / (1024 * 1024);

      // Allow files up to 500MB with IndexedDB
      if (fileSizeMB > 500) {
        reject(new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of 500MB`));
        return;
      }

      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.onload = async (e) => {
        const result = e.target?.result as string;

        // Get image dimensions
        const img = new Image();
        img.onload = async () => {
          const newPhoto: Photo = {
            id: Date.now() + Math.random(),
            date: 'Today',
            src: result,
            alt: file.name,
            width: img.width,
            height: img.height,
            fileSize: file.size,
            isUploaded: true,
          };

          try {
            // Save to IndexedDB
            await savePhotoDB(newPhoto);
            const updated = [...uploadedPhotos, newPhoto];
            setUploadedPhotos(updated);
            setUploadProgress(0);
            resolve(newPhoto);
          } catch (error) {
            setUploadProgress(0);
            reject(error);
          }
        };

        img.onerror = () => {
          setUploadProgress(0);
          reject(new Error('Failed to load image'));
        };
        img.src = result;
      };

      reader.onerror = () => {
        setUploadProgress(0);
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
        // Update overall progress
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
    } catch (error) {
      console.error('Error deleting photo:', error);
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
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
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
  };
}

