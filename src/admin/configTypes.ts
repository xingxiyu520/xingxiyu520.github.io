export type GalleryPhotoConfig = {
  title: string;
  caption: string;
  src: string;
  alt: string;
};

export type MusicTrackConfig = {
  title: string;
  artist: string;
  src: string;
  duration: number;
};

export function normalizeGalleryPhotos(value: unknown): GalleryPhotoConfig[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Record<string, unknown>;
    const title = typeof source.title === 'string' ? source.title.trim() : '';
    const src = typeof source.src === 'string' ? source.src.trim() : '';
    if (!title || !src) return [];

    return [{
      title,
      caption: typeof source.caption === 'string' && source.caption.trim() ? source.caption : title,
      src,
      alt: typeof source.alt === 'string' && source.alt.trim() ? source.alt : title,
    }];
  });
}

export function normalizeMusicTracks(value: unknown): MusicTrackConfig[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Record<string, unknown>;
    const title = typeof source.title === 'string' ? source.title.trim() : '';
    const src = typeof source.src === 'string' ? source.src.trim() : '';
    if (!title || !src) return [];

    return [{
      title,
      artist: typeof source.artist === 'string' && source.artist.trim() ? source.artist : '未知歌手',
      src,
      duration: typeof source.duration === 'number' && source.duration > 0 ? source.duration : 180,
    }];
  });
}
