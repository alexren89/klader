import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, LayoutDashboard, Percent, Users, Package, ShoppingCart, ChevronRight } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/commissions", label: "Comisiones", icon: Percent },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/listings", label: "Artículos", icon: Package },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-600">
              <ShoppingBag className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sage-700">klader</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1 ml-9">Panel de administración</p>
        </div>

        <nav className="p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
            >
              <item.icon className="h-4 w-4 text-gray-400 group-hover:text-sage-600" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 w-56 px-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
            Ir al sitio
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
