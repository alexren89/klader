"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, EyeOff, Eye, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate, conditionLabel } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  status: string;
  images: string[];
  views: number;
  createdAt: string;
  seller: { id: string; name: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "success",
  SOLD: "info",
  RESERVED: "warning",
  INACTIVE: "default",
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/listings?${params}`);
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [search, statusFilter, page]);

  const handleAction = async (id: string, action: "INACTIVE" | "ACTIVE") => {
    setActionId(id);
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    fetchListings();
    setActionId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    setActionId(id);
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    fetchListings();
    setActionId(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Artículos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} artículos en total</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar artículos..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="SOLD">Vendido</option>
          <option value="RESERVED">Reservado</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Artículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Vendedor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Precio</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Vistas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Publicado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sage-500 mx-auto" />
                  </td>
                </tr>
              ) : listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/listings/${listing.id}`} className="flex items-center gap-2.5 hover:opacity-80" target="_blank">
                      {listing.images[0] ? (
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image src={listing.images[0]} alt="" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {conditionLabel(listing.condition)} · {listing.category}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{listing.seller.name}</p>
                    <p className="text-xs text-gray-400">{listing.seller.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatPrice(listing.price)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">{listing.views}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(listing.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={(STATUS_COLORS[listing.status] || "default") as "success" | "info" | "warning" | "default"}
                      size="sm"
                    >
                      {listing.status === "ACTIVE" ? "Activo" :
                       listing.status === "SOLD" ? "Vendido" :
                       listing.status === "RESERVED" ? "Reservado" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {actionId === listing.id ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    ) : (
                      <div className="flex justify-end gap-1">
                        {listing.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleAction(listing.id, "INACTIVE")}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Desactivar"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        ) : listing.status === "INACTIVE" ? (
                          <button
                            onClick={() => handleAction(listing.id, "ACTIVE")}
                            className="rounded p-1.5 text-sage-500 hover:bg-sage-50"
                            title="Activar"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="rounded p-1.5 text-red-400 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
