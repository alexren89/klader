"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { calculateCommissionSync } from "@/lib/commission";

interface CommissionTier {
  id: string;
  label: string;
  minPrice: number | string;
  maxPrice: number | string | null;
  rate: number | string;
  updatedAt: string;
  updatedBy?: string | null;
}

interface TierForm {
  label: string;
  minPrice: string;
  maxPrice: string;
  rate: string;
}

const DEFAULT_FORM: TierForm = {
  label: "",
  minPrice: "",
  maxPrice: "",
  rate: "",
};

export default function CommissionsAdminPage() {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TierForm>(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [simulatorPrice, setSimulatorPrice] = useState("");
  const [simulatorResult, setSimulatorResult] = useState<ReturnType<typeof calculateCommissionSync> | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    const res = await fetch("/api/commissions");
    if (res.ok) setTiers(await res.json());
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (tier: CommissionTier) => {
    setEditingId(tier.id);
    setForm({
      label: tier.label,
      minPrice: String(tier.minPrice),
      maxPrice: tier.maxPrice !== null ? String(tier.maxPrice) : "",
      rate: String(Number(tier.rate) * 100),
    });
    setFormError("");
    setModalOpen(true);
  };

  const validateForm = (): string | null => {
    const min = parseFloat(form.minPrice);
    const max = form.maxPrice ? parseFloat(form.maxPrice) : null;
    const rate = parseFloat(form.rate);

    if (!form.label.trim()) return "La etiqueta es requerida";
    if (isNaN(min) || min < 0) return "El precio mínimo debe ser ≥ 0";
    if (form.maxPrice && (isNaN(parseFloat(form.maxPrice)) || parseFloat(form.maxPrice) <= min)) {
      return "El precio máximo debe ser mayor al mínimo";
    }
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      return "La tasa debe estar entre 0.01% y 100%";
    }

    // Check overlaps with other tiers
    const otherTiers = tiers.filter((t) => t.id !== editingId);
    for (const tier of otherTiers) {
      const tierMin = Number(tier.minPrice);
      const tierMax = tier.maxPrice !== null ? Number(tier.maxPrice) : Infinity;
      const newMax = max ?? Infinity;

      if (
        (min >= tierMin && min <= tierMax) ||
        (newMax >= tierMin && newMax <= tierMax) ||
        (min <= tierMin && newMax >= tierMax)
      ) {
        return `Se superpone con el tramo "${tier.label}" ($${tierMin} - ${
          tierMax === Infinity ? "∞" : `$${tierMax}`
        })`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        label: form.label.trim(),
        minPrice: parseFloat(form.minPrice),
        maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : null,
        rate: parseFloat(form.rate) / 100,
      };

      const url = editingId
        ? `/api/commissions/${editingId}`
        : "/api/commissions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchTiers();
        setModalOpen(false);
      } else {
        const data = await res.json();
        setFormError(data.error || "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/commissions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTiers((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
    }
  };

  const handleSimulate = () => {
    const price = parseFloat(simulatorPrice);
    if (!isNaN(price) && price > 0) {
      const result = calculateCommissionSync(price, tiers);
      setSimulatorResult(result);
    } else {
      setSimulatorResult(null);
    }
  };

  const sortedTiers = [...tiers].sort(
    (a, b) => Number(a.minPrice) - Number(b.minPrice)
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Comisiones
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configura los tramos de comisión que paga el comprador
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Agregar tramo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tiers table */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Tramos actuales</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
              </div>
            ) : sortedTiers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                No hay tramos configurados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                        Etiqueta
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        Precio mín.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        Precio máx.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        Tasa
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedTiers.map((tier) => (
                      <tr
                        key={tier.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {formatPrice(tier.minPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {tier.maxPrice !== null
                            ? formatPrice(tier.maxPrice)
                            : (
                              <span className="text-sage-600 font-medium">
                                Sin límite
                              </span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="success">
                            {(Number(tier.rate) * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(tier)}
                              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(tier.id)}
                              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              ¿Cómo funciona el cálculo?
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              La comisión <strong>siempre la paga el comprador</strong> encima del precio del vendedor.
              El vendedor recibe su precio íntegro. El tramo se determina por el precio base del vendedor.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-blue-700">
              <span>Precio vendedor: $X</span>
              <span>+</span>
              <span>Comisión (X%): $Y</span>
              <span>=</span>
              <span className="font-semibold">Total comprador: $Z</span>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-sage-600" />
              <h2 className="font-semibold text-gray-900">Simulador</h2>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Calcula la comisión para cualquier precio con la configuración actual
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio del vendedor (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={simulatorPrice}
                  onChange={(e) => {
                    setSimulatorPrice(e.target.value);
                    setSimulatorResult(null);
                  }}
                  className="input-field pl-7"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              className="btn-primary w-full justify-center mt-3"
            >
              <Calculator className="h-4 w-4" />
              Calcular
            </button>

            {simulatorResult && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tramo aplicado:</span>
                  <Badge variant="success">{simulatorResult.tierLabel}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tasa:</span>
                  <span className="font-medium text-gray-900">
                    {(simulatorResult.commissionRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comisión:</span>
                  <span className="font-medium text-earth-600">
                    + {formatPrice(simulatorResult.commissionAmount)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    Total comprador:
                  </span>
                  <span className="text-base font-bold text-sage-700">
                    {formatPrice(simulatorResult.totalBuyerPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm bg-sage-50 rounded-lg px-3 py-2">
                  <span className="text-sage-700">Vendedor recibe:</span>
                  <span className="font-semibold text-sage-700">
                    {formatPrice(simulatorResult.sellerReceives)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Visual tiers */}
          {sortedTiers.length > 0 && (
            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                Escala de comisiones
              </h3>
              <div className="space-y-2">
                {sortedTiers.map((tier, i) => (
                  <div key={tier.id} className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-sage-400"
                      style={{
                        width: `${Math.max(20, (1 - Number(tier.rate)) * 100)}%`,
                      }}
                    />
                    <span className="text-xs text-gray-500 shrink-0">
                      {(Number(tier.rate) * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {tier.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar tramo" : "Agregar tramo"}
      >
        <div className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Etiqueta descriptiva *
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="input-field"
              placeholder="Ej: Básico, Estándar, Premium..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio mínimo ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={form.minPrice}
                  onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                  className="input-field pl-7"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio máximo ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={form.maxPrice}
                  onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                  className="input-field pl-7"
                  placeholder="Sin límite"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Dejar vacío = sin límite (último tramo)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tasa de comisión (%) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="input-field pr-8"
                placeholder="Ej: 6.5"
                min="0.01"
                max="100"
                step="0.1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Preview */}
          {form.minPrice && form.rate && (
            <div className="rounded-lg bg-sage-50 border border-sage-200 p-3">
              <p className="text-xs text-sage-700 font-medium mb-1">Vista previa</p>
              <p className="text-xs text-gray-600">
                Para artículos de{" "}
                <strong>{formatPrice(parseFloat(form.minPrice) || 0)}</strong>
                {form.maxPrice ? ` a ${formatPrice(parseFloat(form.maxPrice))}` : " en adelante"}:{" "}
                se añade un <strong>{form.rate}%</strong> al precio del vendedor.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-ghost flex-1 justify-center"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 justify-center"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "Guardar cambios" : "Crear tramo"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          ¿Seguro que quieres eliminar este tramo? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="btn-ghost flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            className="flex-1 btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500 justify-center"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
