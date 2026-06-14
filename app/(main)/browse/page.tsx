"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";

const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "calzado", label: "Calzado" },
  { value: "accesorios", label: "Accesorios" },
  { value: "deportiva", label: "Deportiva" },
  { value: "vintage", label: "Vintage" },
];

const CONDITIONS = [
  { value: "NEW", label: "Nuevo" },
  { value: "LIKE_NEW", label: "Como nuevo" },
  { value: "GOOD", label: "Buen estado" },
  { value: "FAIR", label: "Aceptable" },
];

const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const SHOE_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

const SORT_OPTIONS = [
  { value: "recent", label: "Más reciente" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "views", label: "Más visto" },
];

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  size: string;
  brand?: string;
  category: string;
  images: string[];
  views: number;
  _count: { favorites: number };
  seller: { id: string; name: string; image?: string; rating?: number };
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    condition: searchParams.get("condition") || "",
    size: searchParams.get("size") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "recent",
    page: 1,
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });

    try {
      const res = await fetch(`/api/listings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
        setTotal(data.total);
        setPages(data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, page: 1 };
      // Reset size when switching between calzado and clothing categories
      if (key === "category") {
        const wasCalzado = prev.category === "calzado";
        const isCalzado = value === "calzado";
        if (wasCalzado !== isCalzado) next.size = "";
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      condition: "",
      size: "",
      minPrice: "",
      maxPrice: "",
      sort: "recent",
      page: 1,
    });
  };

  const activeFiltersCount = [
    filters.category,
    filters.condition,
    filters.size,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;


  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Buscar artículos, marcas..."
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative btn-secondary ${showFilters ? "bg-sage-50" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sage-600 text-xs text-white font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="input-field w-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <aside className="w-60 shrink-0">
            <div className="card p-4 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filtros</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-sage-600 hover:text-sage-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Categoría</p>
                <div className="space-y-1">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={c.value}
                        checked={filters.category === c.value}
                        onChange={() => updateFilter("category", c.value)}
                        className="text-sage-600"
                      />
                      <span className="text-sm text-gray-600">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Condición</p>
                <div className="space-y-1">
                  {CONDITIONS.map((c) => (
                    <label
                      key={c.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.condition === c.value}
                        onChange={() =>
                          updateFilter(
                            "condition",
                            filters.condition === c.value ? "" : c.value
                          )
                        }
                        className="text-sage-600 rounded"
                      />
                      <span className="text-sm text-gray-600">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size */}
              {filters.category !== "" && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Talla</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(filters.category === "calzado" ? SHOE_SIZES : CLOTHING_SIZES).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateFilter("size", filters.size === s ? "" : s)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                          filters.size === s
                            ? "bg-sage-600 text-white border-sage-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-sage-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filters.category === "" && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Talla ropa</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CLOTHING_SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateFilter("size", filters.size === s ? "" : s)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                          filters.size === s
                            ? "bg-sage-600 text-white border-sage-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-sage-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price range */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Precio</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    placeholder="Min"
                    className="input-field w-full text-sm"
                    min="0"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    placeholder="Max"
                    className="input-field w-full text-sm"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Category pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => updateFilter("category", c.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.category === c.value
                    ? "bg-sage-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-sage-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? "Buscando..." : `${total} artículos encontrados`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-gray-500">No se encontraron artículos</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-sage-600 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    className="btn-ghost px-3 py-2 disabled:opacity-40"
                  >
                    ← Anterior
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    {filters.page} / {pages}
                  </span>
                  <button
                    disabled={filters.page >= pages}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    className="btn-ghost px-3 py-2 disabled:opacity-40"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
