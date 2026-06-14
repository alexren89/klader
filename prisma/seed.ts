import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function img(urls: string[]): string {
  return JSON.stringify(urls);
}

async function main() {
  console.log("Seeding database...");

  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.commissionTier.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Default commission tiers
  await prisma.commissionTier.createMany({
    data: [
      { label: "Básico",    minPrice: 0,      maxPrice: 15,   rate: 0.08  },
      { label: "Estándar",  minPrice: 15.01,  maxPrice: 50,   rate: 0.06  },
      { label: "Premium",   minPrice: 50.01,  maxPrice: 150,  rate: 0.05  },
      { label: "Lujo",      minPrice: 150.01, maxPrice: null, rate: 0.035 },
    ],
  });
  console.log("✓ Commission tiers");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@klader.com",
      name: "Admin Klader",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      location: "Madrid, España",
    },
  });

  const sellerPassword = await bcrypt.hash("seller123", 12);
  const seller = await prisma.user.create({
    data: {
      email: "vendedor@klader.com",
      name: "María García",
      password: sellerPassword,
      role: "USER",
      emailVerified: new Date(),
      bio: "Amante de la moda sostenible. Vendo ropa de calidad a precios justos.",
      location: "Barcelona, España",
      rating: 4.8,
      totalSales: 23,
    },
  });

  const buyerPassword = await bcrypt.hash("buyer123", 12);
  await prisma.user.create({
    data: {
      email: "comprador@klader.com",
      name: "Carlos López",
      password: buyerPassword,
      role: "USER",
      emailVerified: new Date(),
      location: "Valencia, España",
    },
  });
  console.log("✓ Users");

  const listings = [
    {
      title: "Vestido floral de verano",
      description: "Precioso vestido floral en tonos azules y blancos. Talla M. Usado solo una vez para una boda, está en perfecto estado.",
      price: 35,
      condition: "LIKE_NEW",
      size: "M",
      brand: "Zara",
      category: "mujer",
      subcategory: "vestidos",
      images: img(["https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600"]),
      status: "ACTIVE",
      views: 47,
      sellerId: seller.id,
    },
    {
      title: "Chaqueta vaquera vintage 90s",
      description: "Auténtica chaqueta vaquera estilo vintage de los años 90. Tiene algunos desgastes naturales del uso que le dan ese look retro tan buscado.",
      price: 45,
      condition: "GOOD",
      size: "L",
      brand: "Levi's",
      category: "unisex",
      subcategory: "chaquetas",
      images: img(["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600"]),
      status: "ACTIVE",
      views: 89,
      sellerId: seller.id,
    },
    {
      title: "Zapatillas Nike Air Max 90",
      description: "Nike Air Max 90 en colorway blanco/negro. Talla 42. Las compré pero no me quedan bien, han tenido muy poco uso.",
      price: 80,
      condition: "LIKE_NEW",
      size: "42",
      brand: "Nike",
      category: "calzado",
      subcategory: "zapatillas",
      images: img(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600"]),
      status: "ACTIVE",
      views: 124,
      sellerId: seller.id,
    },
    {
      title: "Abrigo camel de lana",
      description: "Elegante abrigo de lana en tono camel. Perfecto para el otoño-invierno. Talla S/M. Marca premium, muy buena calidad.",
      price: 120,
      condition: "GOOD",
      size: "S",
      brand: "Massimo Dutti",
      category: "mujer",
      subcategory: "abrigos",
      images: img(["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600"]),
      status: "ACTIVE",
      views: 56,
      sellerId: seller.id,
    },
    {
      title: "Camisa de lino blanca",
      description: "Camisa de lino en color blanco roto. Muy fresca para verano. Talla L. Ligeros pliegues de plancha pero muy buen estado.",
      price: 22,
      condition: "GOOD",
      size: "L",
      brand: "Pull & Bear",
      category: "hombre",
      subcategory: "camisas",
      images: img(["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"]),
      status: "ACTIVE",
      views: 31,
      sellerId: seller.id,
    },
    {
      title: "Bolso de cuero marrón",
      description: "Bolso de mano en cuero genuino marrón oscuro. Muy espacioso, tiene varios compartimentos internos. Marca italiana.",
      price: 200,
      condition: "LIKE_NEW",
      size: "Única",
      brand: "Furla",
      category: "accesorios",
      subcategory: "bolsos",
      images: img(["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"]),
      status: "ACTIVE",
      views: 78,
      sellerId: seller.id,
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({ data: listing });
  }
  console.log("✓ Sample listings");

  console.log("\n✅ Seed completed!");
  console.log("   admin@klader.com     / admin123");
  console.log("   vendedor@klader.com  / seller123");
  console.log("   comprador@klader.com / buyer123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
