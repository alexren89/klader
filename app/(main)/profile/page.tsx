"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, Loader2, MapPin, Heart, Palmtree, Eye, EyeOff, Camera } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", bio: "", location: "" });
  const [listings, setListings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationLoading, setVacationLoading] = useState(false);
  const [hidingId, setHidingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setForm({ name: session.user.name || "", bio: "", location: "" });

    Promise.all([
      fetch(`/api/listings?sellerId=${session.user.id}`).then((r) => r.json()),
      fetch("/api/favorites").then((r) => r.json()),
      fetch("/api/users/vacation").then((r) => r.json()),
    ]).then(([listingsData, favData, vacData]) => {
      setListings(listingsData.listings || []);
      setFavorites(Array.isArray(favData) ? favData : []);
      setVacationMode(vacData.vacationMode ?? false);
    });
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        await update({ name: form.name });
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();
      const saveRes = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (saveRes.ok) await update({ image: url });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleVacation = async () => {
    setVacationLoading(true);
    try {
      const res = await fetch("/api/users/vacation", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setVacationMode(data.vacationMode);
      }
    } finally {
      setVacationLoading(false);
    }
  };

  const toggleListingVisibility = async (listingId: string) => {
    setHidingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/visibility`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, hidden: data.hidden } : l))
        );
      }
    } finally {
      setHidingId(null);
    }
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              {session.user.image ? (
                <Image src={session.user.image} alt={session.user.name || ""} width={80} height={80}
                  className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-2xl font-bold mx-auto">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white shadow hover:bg-gray-700 transition-colors">
                {uploadingAvatar
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Camera className="h-3.5 w-3.5" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <h2 className="font-bold text-gray-900">{session.user.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{session.user.email}</p>
            <div className="mt-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="font-bold text-gray-900">{listings.length}</p>
                <p className="text-xs text-gray-400">artículos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{favorites.length}</p>
                <p className="text-xs text-gray-400">guardados</p>
              </div>
            </div>
          </div>

          {/* Vacation mode card */}
          <div className={cn(
            "card p-5 transition-colors",
            vacationMode && "border-amber-200 bg-amber-50"
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Palmtree className={cn("h-5 w-5 shrink-0", vacationMode ? "text-amber-500" : "text-gray-400")} />
                <div>
                  <p className={cn("text-sm font-semibold", vacationMode ? "text-amber-800" : "text-gray-700")}>
                    Modo vacaciones
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                    Oculta todos tus artículos mientras estás fuera
                  </p>
                </div>
              </div>
              {/* Toggle switch */}
              <button
                onClick={toggleVacation}
                disabled={vacationLoading}
                className={cn(
                  "relative shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                  vacationMode
                    ? "bg-amber-400 focus:ring-amber-400"
                    : "bg-gray-200 focus:ring-gray-300"
                )}
              >
                {vacationLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                  </span>
                )}
                <span className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  vacationMode && "translate-x-5",
                  vacationLoading && "opacity-0"
                )} />
              </button>
            </div>
            {vacationMode && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                🌴 Tus artículos están ocultos para otros usuarios.
              </p>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Información personal</h2>
            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                ✓ Perfil actualizado correctamente
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubicación</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input-field pl-9" placeholder="Ciudad, País" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sobre mí</label>
              <textarea value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input-field min-h-[80px] resize-y"
                placeholder="Cuéntanos un poco sobre ti..." maxLength={500} />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {/* My listings */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Mis artículos ({listings.length})
          </h2>
          <Link href="/listings/new" className="btn-primary text-xs px-3 py-2">
            + Publicar artículo
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
            Aún no has publicado ningún artículo.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {listings.map((listing) => (
              <div key={listing.id} className="relative group/item">
                {/* Dimmed overlay when hidden */}
                <div className={cn(
                  "transition-opacity",
                  listing.hidden && "opacity-50"
                )}>
                  <ListingCard listing={listing} showSeller={false} />
                </div>

                {/* Hidden badge */}
                {listing.hidden && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                      <EyeOff className="h-3 w-3" />
                      Oculto
                    </span>
                  </div>
                )}

                {/* Visibility toggle button */}
                <button
                  onClick={() => toggleListingVisibility(listing.id)}
                  disabled={hidingId === listing.id}
                  className={cn(
                    "absolute bottom-[52px] right-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md transition-all",
                    "opacity-0 group-hover/item:opacity-100",
                    listing.hidden
                      ? "bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  )}
                >
                  {hidingId === listing.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : listing.hidden ? (
                    <><Eye className="h-3 w-3" />Mostrar</>
                  ) : (
                    <><EyeOff className="h-3 w-3" />Ocultar</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liked products */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-400 fill-red-400" />
          Artículos que me gustan ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
            Aún no has guardado ningún artículo. Dale al corazón en cualquier producto para verlo aquí.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {favorites.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
