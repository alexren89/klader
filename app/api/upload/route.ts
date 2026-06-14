import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const cloudinaryConfigured =
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "your-api-key";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { image } = await req.json();

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });
    }

    // Use Cloudinary if configured, otherwise save locally
    if (cloudinaryConfigured) {
      const url = await uploadImage(image);
      return NextResponse.json({ url });
    }

    // Local fallback: save to public/uploads/
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Detect extension from data URL
    const mimeMatch = image.match(/^data:image\/(\w+);base64,/);
    const ext = mimeMatch ? mimeMatch[1].replace("jpeg", "jpg") : "jpg";
    const filename = `${randomUUID()}.${ext}`;

    const uploadDir = join(process.cwd(), "public", "uploads");
    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}
