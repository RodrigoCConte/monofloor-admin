const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Check-ins de ontem (23/12)
  const yesterday = new Date('2025-12-23T00:00:00Z');
  const today = new Date('2025-12-24T00:00:00Z');

  console.log("\n=== CHECK-INS DE ONTEM (23/12) ===");

  const yesterdayCheckins = await prisma.checkin.findMany({
    where: {
      checkinAt: {
        gte: yesterday,
        lt: today
      }
    },
    include: {
      user: { select: { name: true } },
      project: { select: { cliente: true } }
    },
    orderBy: { checkinAt: "desc" }
  });

  console.log("Total check-ins:", yesterdayCheckins.length);

  for (const c of yesterdayCheckins) {
    console.log("\n- User:", c.user.name);
    console.log("  Project:", c.project.cliente);
    console.log("  CheckIn:", c.checkinAt);
    console.log("  CheckOut:", c.checkoutAt || "AINDA ATIVO");
    console.log("  Reason:", c.checkoutReason || "-");
    console.log("  IsAuto:", c.isAutoCheckout);
  }

  // Verificar o cron service
  console.log("\n=== VERIFICANDO CRON SERVICE ===");

  // Contar quantos checkins ativos existiram por mais de 8h
  const longCheckins = await prisma.checkin.findMany({
    where: {
      checkinAt: { lt: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      checkoutAt: null
    },
    include: {
      user: { select: { name: true } }
    }
  });

  console.log("Check-ins ativos há mais de 8h:", longCheckins.length);
  for (const c of longCheckins) {
    const hours = Math.round((Date.now() - c.checkinAt.getTime()) / (1000 * 60 * 60));
    console.log(`  - ${c.user.name}: ${hours}h ativo`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
