/**
 * SQLite stores images as a JSON string since it doesn't support arrays.
 * These helpers handle serialization/deserialization.
 */

export function parseImages(images: string | string[]): string[] {
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeImages(images: string[]): string {
  return JSON.stringify(images);
}

/** Transform a raw listing from Prisma (with images as string) to have images as string[] */
export function transformListing<T extends { images: string | string[] }>(
  listing: T
): Omit<T, "images"> & { images: string[] } {
  return { ...listing, images: parseImages(listing.images) };
}

export function transformListings<T extends { images: string | string[] }>(
  listings: T[]
): (Omit<T, "images"> & { images: string[] })[] {
  return listings.map(transformListing);
}
