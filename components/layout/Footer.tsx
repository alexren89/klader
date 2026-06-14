import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-600">
                <ShoppingBag className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-sage-700">klader</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Moda de segunda mano. Compra y vende de forma sostenible.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Comprar</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/browse?category=mujer" className="hover:text-sage-600">Mujer</Link></li>
              <li><Link href="/browse?category=hombre" className="hover:text-sage-600">Hombre</Link></li>
              <li><Link href="/browse?category=calzado" className="hover:text-sage-600">Calzado</Link></li>
              <li><Link href="/browse?category=accesorios" className="hover:text-sage-600">Accesorios</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Vender</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/listings/new" className="hover:text-sage-600">Publicar artículo</Link></li>
              <li><Link href="/profile" className="hover:text-sage-600">Mi perfil</Link></li>
              <li><Link href="/orders" className="hover:text-sage-600">Mis pedidos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Klader</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="cursor-default">Cómo funciona</span></li>
              <li><span className="cursor-default">Comisiones</span></li>
              <li><span className="cursor-default">Ayuda</span></li>
              <li><span className="cursor-default">Privacidad</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Klader. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Hecho con <Heart className="h-3 w-3 text-red-400 fill-red-400" /> para la moda sostenible
          </p>
        </div>
      </div>
    </footer>
  );
}
