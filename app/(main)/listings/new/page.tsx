"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, GripVertical, Loader2, AlertCircle } from "lucide-react";
import { CommissionDisplay } from "@/components/commission/CommissionDisplay";

const CATEGORIES = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "calzado", label: "Calzado" },
  { value: "accesorios", label: "Accesorios" },
  { value: "deportiva", label: "Ropa deportiva" },
  { value: "vintage", label: "Vintage" },
  { value: "infantil", label: "Infantil" },
  { value: "unisex", label: "Unisex" },
];

const CONDITIONS = [
  { value: "NEW", label: "Nuevo con etiqueta" },
  { value: "LIKE_NEW", label: "Como nuevo" },
  { value: "GOOD", label: "Buen estado" },
  { value: "FAIR", label: "Aceptable" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "34", "36", "38", "40", "42", "44", "46", "Única"];

export default function NewListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    condition: "GOOD",
    size: "",
    brand: "",
    category: "",
    subcategory: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = 8 - images.length;
    const files = acceptedFiles.slice(0, remaining);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (res.ok) {
          const { url } = await res.json();
          uploaded.push(url);
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setError("Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    disabled: images.length >= 8 || uploading,
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Debes subir al menos una imagen");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          images,
        }),
      });

      if (res.ok) {
        const listing = await res.json();
        router.push(`/listings/${listing.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Error al publicar el artículo");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Publicar artículo</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Images */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Fotos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sube hasta 8 fotos. La primera será la portada.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
              >
                <Image src={img} alt="" fill className="object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    Portada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {images.length < 8 && (
              <div
                {...getRootProps()}
                className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-sage-400 bg-sage-50"
                    : "border-gray-300 hover:border-sage-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-sage-500" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Añadir</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Información del artículo</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="Ej: Vestido floral talla M"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field min-h-[100px] resize-y"
              placeholder="Describe el estado, medidas, defectos si los hay..."
              required
              minLength={10}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {form.description.length}/2000
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoría *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Condición *
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="input-field"
                required
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Talla *
              </label>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Marca
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="input-field"
                placeholder="Zara, Nike..."
              />
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Precio</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Precio de venta (CLP) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                $
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input-field pl-7"
                placeholder="0"
                min="1"
                max="10000000"
                step="1"
                required
              />
            </div>
          </div>

          {form.price && parseFloat(form.price) > 0 && (
            <div className="mt-4">
              <CommissionDisplay
                basePrice={parseFloat(form.price)}
                mode="full"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="btn-primary flex-1 justify-center py-3"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Publicar artículo
          </button>
        </div>
      </form>
    </div>
  );
}
