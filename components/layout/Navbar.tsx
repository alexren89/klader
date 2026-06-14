"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MessageCircle, User, LogOut, Plus, Search, Package, Shield, X, Menu } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Mujer",      href: "/browse?category=mujer" },
  { label: "Hombre",     href: "/browse?category=hombre" },
  { label: "Calzado",    href: "/browse?category=calzado" },
  { label: "Accesorios", href: "/browse?category=accesorios" },
  { label: "Vintage",    href: "/browse?category=vintage" },
];

function KladerMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M50 14 a36 36 0 1 1 -25.5 10.5" stroke="#5C2E8E" strokeWidth="11" strokeLinecap="round" />
      <circle cx="50" cy="14" r="6.4" fill="#FF7E6B" />
    </svg>
  );
}

function KladerLockup({ size = 28 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.32) }}>
      <KladerMark size={size} />
      <span
        style={{
          fontFamily: "var(--font-display, 'Unbounded', sans-serif)",
          fontWeight: 600,
          fontSize: size * 0.9,
          letterSpacing: "-0.02em",
          color: "#5C2E8E",
          lineHeight: 1,
        }}
      >
        kl
        <span style={{ position: "relative" }}>
          a
          <span
            style={{
              position: "absolute",
              top: "-0.55em",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "0.1em",
            }}
          >
            <span style={{ width: "0.1em", height: "0.1em", borderRadius: "50%", background: "#FF7E6B" }} />
            <span style={{ width: "0.1em", height: "0.1em", borderRadius: "50%", background: "#FF7E6B" }} />
          </span>
        </span>
        der
      </span>
    </span>
  );
}

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
            (sum: number, c: { _count?: { messages?: number } }) => sum + (c._count?.messages || 0),
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
          "sticky top-0 z-40 transition-all duration-200",
          scrolled
            ? "bg-white shadow-[0_2px_16px_rgba(35,19,55,0.10)]"
            : "bg-white border-b border-neutral-200"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[62px] items-center justify-between gap-4">
            {/* Mobile menu */}
            <button
              className="sm:hidden p-2 -ml-2 text-plum-400 hover:text-plum-600 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <KladerLockup size={28} />
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md hidden sm:block">
              <Link
                href="/browse"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-pill border border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-plum-300 hover:bg-plum-50 transition-all"
              >
                <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                <span>Buscar marcas, artículos…</span>
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              {session?.user ? (
                <>
                  <Link href="/listings/new" className="btn-accent hidden sm:inline-flex text-xs px-4" style={{ height: 36 }}>
                    <Plus className="h-3.5 w-3.5" />
                    Vender
                  </Link>

                  <Link
                    href="/messages"
                    className={cn(
                      "relative p-2.5 rounded-full transition-colors",
                      pathname.startsWith("/messages")
                        ? "text-plum-600 bg-plum-50"
                        : "text-neutral-500 hover:bg-neutral-100"
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-coral-400 text-[9px] font-bold text-plum-900">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center p-1 rounded-full hover:ring-2 hover:ring-plum-200 transition-all"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || ""}
                          width={34} height={34}
                          className="h-[34px] w-[34px] rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-white text-sm font-semibold"
                          style={{ background: "var(--brand-primary)", fontFamily: "var(--font-display)" }}
                        >
                          {session.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-[20px] border border-neutral-200 bg-white py-2 shadow-[0_8px_32px_rgba(35,19,55,0.14)]">
                          <div className="border-b border-neutral-100 px-4 pb-3 pt-2">
                            <p className="font-semibold text-neutral-900 text-sm">{session.user.name}</p>
                            <p className="text-xs text-neutral-500 truncate mt-0.5">{session.user.email}</p>
                          </div>
                          <nav className="py-1.5">
                            {[
                              { href: "/profile", icon: User, label: "Mi perfil" },
                              { href: "/orders",  icon: Package, label: "Mis pedidos" },
                            ].map(({ href, icon: Icon, label }) => (
                              <Link key={href} href={href} onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-plum-50 hover:text-plum-600 transition-colors">
                                <Icon className="h-4 w-4 text-neutral-400" />{label}
                              </Link>
                            ))}
                            {session.user.role === "ADMIN" && (
                              <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-plum-600 hover:bg-plum-50 transition-colors">
                                <Shield className="h-4 w-4 text-plum-400" />Panel admin
                              </Link>
                            )}
                          </nav>
                          <div className="border-t border-neutral-100 pt-1.5">
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
                  <Link href="/login" className="text-sm font-medium px-3 py-2 transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    Iniciar sesión
                  </Link>
                  <Link href="/register" className="btn-primary text-xs px-4" style={{ height: 36 }}>
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
          <div className="fixed inset-0 z-50 bg-plum-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-[8px_0_40px_rgba(35,19,55,0.18)] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <KladerLockup size={24} />
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              <Link href="/browse" onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-plum-50 hover:text-plum-600 transition-colors">
                Todo
              </Link>
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-plum-50 hover:text-plum-600 transition-colors">
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-neutral-100 pt-3 mt-3">
                <Link href="/listings/new" onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-coral-50 transition-colors"
                  style={{ color: "var(--brand-accent)" }}>
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
