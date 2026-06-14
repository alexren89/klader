import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadImage(file: string): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder: "klader",
    transformation: [
      { width: 800, height: 800, crop: "limit" },
      { quality: "auto" },
      { format: "webp" },
    ],
  });
  return result.secure_url;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function extractPublicId(url: string): string {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  return `${folder}/${filename.split(".")[0]}`;
}
