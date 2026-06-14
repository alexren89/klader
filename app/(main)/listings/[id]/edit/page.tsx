"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save, AlertCircle } from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "Nuevo con etiqueta" },
  { value: "LIKE_NEW", label: "Como nuevo" },
  { value: "GOOD", label: "Buen estado" },
  { value: "FAIR", label: "Aceptable" },
];

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    condition: "GOOD",
    size: "",
    brand: "",
  });

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((listing) => {
        if (listing.sellerId !== session?.user?.id && session?.user?.role !== "ADMIN") {
          router.push("/");
          return;
        }
        setForm({
          title: listing.title,
          description: listing.description,
          price: String(listing.price),
          condition: listing.condition,
          size: listing.size,
          brand: listing.brand || "",
        });
        setLoading(false);
      });
  }, [id, session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    });

    if (res.ok) {
      router.push(`/listings/${id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Error al guardar");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar artículo</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field min-h-[100px] resize-y"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio ($)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="input-field"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Condición</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="input-field"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Talla</label>
            <input
              type="text"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost flex-1 justify-center">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
