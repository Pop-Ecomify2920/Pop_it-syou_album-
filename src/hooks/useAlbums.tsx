import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

export function useAlbums() {
  const queryClient = useQueryClient();

  const { data: albums = [], isLoading, error } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .order('updated_at', { ascending: false });

      if (albumsError) throw albumsError;

      // Get photo counts and dates for each album
      const albumsWithCounts = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { count } = await supabase
            .from('album_photos')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);

          const { data: photos } = await supabase
            .from('album_photos')
            .select('photo_id, photos(taken_at, created_at)')
            .eq('album_id', album.id)
            .order('added_at', { ascending: false });

          let mostRecent: string | null = null;
          let oldest: string | null = null;

          if (photos && photos.length > 0) {
            const dates = photos
              .map((p: any) => p.photos?.taken_at || p.photos?.created_at)
              .filter(Boolean)
              .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
            
            if (dates.length > 0) {
              mostRecent = dates[0];
              oldest = dates[dates.length - 1];
            }
          }

          return {
            ...album,
            photo_count: count || 0,
            most_recent_photo: mostRecent,
            oldest_photo: oldest,
          };
        })
      );

      return albumsWithCounts as Album[];
    },
  });

  const createAlbum = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('albums')
        .insert({
          name,
          description: description || null,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create album: ' + error.message);
    },
  });

  const updateAlbum = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('albums')
        .update({ name, description: description || null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update album: ' + error.message);
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('albums').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete album: ' + error.message);
    },
  });

  return {
    albums,
    isLoading,
    error,
    createAlbum,
    updateAlbum,
    deleteAlbum,
  };
}
