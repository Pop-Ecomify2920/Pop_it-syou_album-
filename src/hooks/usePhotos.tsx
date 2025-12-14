import { useState, useEffect } from 'react';

export interface Photo {
  id: number;
  date: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isUploaded?: boolean; // Flag to identify uploaded photos
}

const STORAGE_KEY = 'uploaded_photos';

// Load uploaded photos from localStorage
const loadUploadedPhotos = (): Photo[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading uploaded photos:', error);
  }
  return [];
};

// Save uploaded photos to localStorage
const saveUploadedPhotos = (photos: Photo[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (error) {
    console.error('Error saving uploaded photos:', error);
  }
};

export function usePhotos() {
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>(loadUploadedPhotos());

  // Load photos from localStorage on mount
  useEffect(() => {
    setUploadedPhotos(loadUploadedPhotos());
  }, []);

  const uploadPhoto = async (file: File): Promise<Photo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          const newPhoto: Photo = {
            id: Date.now() + Math.random(), // Unique ID
            date: 'Today',
            src: result,
            alt: file.name,
            width: img.width,
            height: img.height,
            isUploaded: true,
          };

          // Add to uploaded photos
          const updated = [...uploadedPhotos, newPhoto];
          setUploadedPhotos(updated);
          saveUploadedPhotos(updated);

          resolve(newPhoto);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadMultiplePhotos = async (files: FileList | File[]): Promise<Photo[]> => {
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadPhoto(file));
    return Promise.all(uploadPromises);
  };

  const deletePhoto = (id: number) => {
    const updated = uploadedPhotos.filter(p => p.id !== id);
    setUploadedPhotos(updated);
    saveUploadedPhotos(updated);
  };

  const getAllPhotos = (): Photo[] => {
    return uploadedPhotos;
  };

  return {
    uploadedPhotos,
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    getAllPhotos,
  };
}

