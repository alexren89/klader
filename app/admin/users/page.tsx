"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  UserX,
  UserCheck,
  Shield,
  ChevronDown,
  Loader2,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "USER" | "ADMIN";
  suspended: boolean;
  rating: number;
  totalSales: number;
  createdAt: string;
  _count: { listings: number; buyerOrders: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
    });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const handleAction = async (userId: string, action: string, role?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role }),
      });
      if (res.ok) fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} usuarios registrados</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre o email..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">Todos los roles</option>
          <option value="USER">Usuario</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rol</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Artículos</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Ventas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Registro</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sage-500 mx-auto" />
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "ADMIN" ? "info" : "default"} size="sm">
                      {user.role === "ADMIN" ? "Admin" : "Usuario"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {user._count.listings}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {user.totalSales}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={user.suspended ? "danger" : "success"} size="sm">
                      {user.suspended ? "Suspendido" : "Activo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-sage-500 ml-auto" />
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAction(user.id, user.suspended ? "unsuspend" : "suspend")}
                          className={`rounded p-1.5 transition-colors text-xs ${
                            user.suspended
                              ? "text-sage-600 hover:bg-sage-50"
                              : "text-red-500 hover:bg-red-50"
                          }`}
                          title={user.suspended ? "Activar cuenta" : "Suspender cuenta"}
                        >
                          {user.suspended ? (
                            <UserCheck className="h-3.5 w-3.5" />
                          ) : (
                            <UserX className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleAction(
                              user.id,
                              "changeRole",
                              user.role === "ADMIN" ? "USER" : "ADMIN"
                            )
                          }
                          className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Cambiar rol"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page} de {pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
