const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. Check-ins ativos
  const activeCheckins = await prisma.checkin.findMany({
    where: { checkoutAt: null },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { cliente: true } }
    },
    orderBy: { checkinAt: "desc" },
    take: 10
  });

  console.log("\n=== CHECK-INS ATIVOS ===");
  console.log("Total:", activeCheckins.length);

  for (const c of activeCheckins) {
    // Buscar location
    const loc = await prisma.userLocation.findUnique({
      where: { userId: c.userId }
    });

    console.log("\n- User:", c.user.name);
    console.log("  Project:", c.project.cliente);
    console.log("  CheckIn:", c.checkinAt);
    if (loc) {
      console.log("  GPS Enabled:", loc.gpsEnabled);
      console.log("  No GPS Confirmations:", loc.noGpsConfirmations);
      console.log("  Location Updated:", loc.updatedAt);
    } else {
      console.log("  No location data");
    }
  }

  // 2. Verificar checkouts automaticos recentes
  const autoCheckouts = await prisma.checkin.findMany({
    where: {
      checkoutReason: { in: ["GPS_DESATIVADO", "INATIVIDADE"] },
      checkoutAt: { not: null }
    },
    include: {
      user: { select: { name: true } },
      project: { select: { cliente: true } }
    },
    orderBy: { checkoutAt: "desc" },
    take: 5
  });

  console.log("\n=== AUTO-CHECKOUTS RECENTES ===");
  console.log("Total:", autoCheckouts.length);
  for (const c of autoCheckouts) {
    console.log("\n- User:", c.user.name);
    console.log("  Project:", c.project.cliente);
    console.log("  Checkout:", c.checkoutAt);
    console.log("  Reason:", c.checkoutReason);
    console.log("  IsAuto:", c.isAutoCheckout);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
