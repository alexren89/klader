"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  MessageCircle,
  User,
  LogOut,
  Plus,
  Search,
  Package,
  Shield,
  X,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Mujer", href: "/browse?category=mujer" },
  { label: "Hombre", href: "/browse?category=hombre" },
  { label: "Calzado", href: "/browse?category=calzado" },
  { label: "Accesorios", href: "/browse?category=accesorios" },
  { label: "Vintage", href: "/browse?category=vintage" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const convos = await res.json();
          const total = convos.reduce(
            (sum: number, c: { _count?: { messages?: number } }) =>
              sum + (c._count?.messages || 0),
            0
          );
          setUnreadMessages(total);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-white transition-shadow duration-200",
          scrolled ? "shadow-[0_1px_12px_rgba(0,0,0,0.08)]" : "border-b border-stone-100"
        )}
      >
        {/* Top bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[60px] items-center justify-between gap-4">
            {/* Mobile menu btn */}
            <button
              className="sm:hidden p-2 -ml-2 text-stone-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-stone-900">klader</span>
            </Link>

            {/* Center search */}
            <div className="flex-1 max-w-md hidden sm:block">
              <Link
                href="/browse"
                className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-gray-400 hover:border-gray-300 hover:bg-stone-100 transition-colors"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Buscar marcas, artículos…</span>
              </Link>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {session?.user ? (
                <>
                  <Link
                    href="/listings/new"
                    className="btn-primary hidden sm:inline-flex text-xs px-4 py-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Vender
                  </Link>

                  <Link
                    href="/messages"
                    className={cn(
                      "relative p-2.5 rounded-full text-stone-600 hover:bg-stone-100 transition-colors",
                      pathname.startsWith("/messages") && "text-stone-900 bg-stone-100"
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center p-1 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || ""}
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-stone-900 text-white text-sm font-semibold">
                          {session.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-stone-100 bg-white py-2 shadow-xl shadow-black/10">
                          <div className="border-b border-stone-100 px-4 pb-3 pt-2">
                            <p className="font-semibold text-stone-900 text-sm">{session.user.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{session.user.email}</p>
                          </div>
                          <nav className="py-1.5">
                            <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                              <User className="h-4 w-4 text-gray-400" />Mi perfil
                            </Link>
                            <Link href="/orders" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                              <Package className="h-4 w-4 text-gray-400" />Mis pedidos
                            </Link>
                            {session.user.role === "ADMIN" && (
                              <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-sage-700 hover:bg-sage-50 transition-colors">
                                <Shield className="h-4 w-4 text-sage-500" />Panel admin
                              </Link>
                            )}
                          </nav>
                          <div className="border-t border-stone-100 pt-1.5">
                            <button
                              onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="h-4 w-4" />Cerrar sesión
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-stone-600 px-3 py-2 hover:text-stone-900 transition-colors">
                    Iniciar sesión
                  </Link>
                  <Link href="/register" className="btn-primary text-xs px-4 py-2">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <span className="font-bold text-stone-900">Menú</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-stone-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <Link href="/browse" onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50">
                Todo
              </Link>
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50">
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-stone-100 pt-3 mt-3">
                <Link href="/listings/new" onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-900 hover:bg-stone-50">
                  + Vender artículo
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
