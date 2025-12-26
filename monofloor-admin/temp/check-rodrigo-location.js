const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Buscar usuário Rodrigo
  const rodrigo = await prisma.user.findFirst({
    where: { name: { contains: "Rodrigo" } },
    select: { id: true, name: true }
  });

  if (!rodrigo) {
    console.log("Usuário Rodrigo não encontrado");
    return;
  }

  console.log("\n=== USUÁRIO ===");
  console.log("ID:", rodrigo.id);
  console.log("Nome:", rodrigo.name);

  // Datas de ontem
  const yesterday = new Date('2025-12-23T00:00:00Z');
  const today = new Date('2025-12-24T00:00:00Z');

  // Buscar check-ins de ontem
  console.log("\n=== CHECK-INS DE ONTEM (23/12) ===");
  const checkins = await prisma.checkin.findMany({
    where: {
      userId: rodrigo.id,
      checkinAt: { gte: yesterday, lt: today }
    },
    include: {
      project: { select: { cliente: true, latitude: true, longitude: true } }
    },
    orderBy: { checkinAt: "asc" }
  });

  console.log("Total check-ins:", checkins.length);
  for (const c of checkins) {
    console.log("\n- CheckIn:", c.checkinAt);
    console.log("  CheckOut:", c.checkoutAt || "AINDA ATIVO");
    console.log("  Projeto:", c.project.cliente);
    console.log("  Projeto Lat/Lng:", c.project.latitude, c.project.longitude);
    console.log("  Reason:", c.checkoutReason);
    console.log("  IsAuto:", c.isAutoCheckout);
    console.log("  Distância CheckIn:", c.checkinDistance, "m");
    console.log("  Distância CheckOut:", c.checkoutDistance, "m");
  }

  // Buscar histórico de localização de ontem
  console.log("\n=== HISTÓRICO DE LOCALIZAÇÃO ONTEM ===");
  const locationHistory = await prisma.locationHistory.findMany({
    where: {
      userId: rodrigo.id,
      createdAt: { gte: yesterday, lt: today }
    },
    orderBy: { createdAt: "asc" }
  });

  console.log("Total registros:", locationHistory.length);

  // Mostrar apenas alguns pontos relevantes
  if (locationHistory.length > 0) {
    console.log("\nPrimeiros 5 registros:");
    for (let i = 0; i < Math.min(5, locationHistory.length); i++) {
      const loc = locationHistory[i];
      console.log(`  ${loc.createdAt.toISOString()} - Lat: ${loc.latitude}, Lng: ${loc.longitude}`);
    }

    console.log("\nÚltimos 5 registros:");
    for (let i = Math.max(0, locationHistory.length - 5); i < locationHistory.length; i++) {
      const loc = locationHistory[i];
      console.log(`  ${loc.createdAt.toISOString()} - Lat: ${loc.latitude}, Lng: ${loc.longitude}`);
    }
  }

  // Calcular distâncias para o projeto durante check-in
  if (checkins.length > 0 && locationHistory.length > 0) {
    console.log("\n=== ANÁLISE DE DISTÂNCIAS ===");

    for (const checkin of checkins) {
      if (!checkin.project.latitude || !checkin.project.longitude) {
        console.log(`\nProjeto ${checkin.project.cliente}: Sem coordenadas definidas!`);
        continue;
      }

      const projectLat = Number(checkin.project.latitude);
      const projectLng = Number(checkin.project.longitude);

      // Filtrar localizações durante o check-in
      const locsDuringCheckin = locationHistory.filter(loc => {
        const locTime = loc.createdAt.getTime();
        const checkinTime = checkin.checkinAt.getTime();
        const checkoutTime = checkin.checkoutAt ? checkin.checkoutAt.getTime() : Date.now();
        return locTime >= checkinTime && locTime <= checkoutTime;
      });

      console.log(`\nProjeto: ${checkin.project.cliente}`);
      console.log(`Projeto Coords: ${projectLat}, ${projectLng}`);
      console.log(`Período: ${checkin.checkinAt.toISOString()} - ${checkin.checkoutAt?.toISOString() || 'ativo'}`);
      console.log(`Localizações durante check-in: ${locsDuringCheckin.length}`);

      // Calcular distância para cada ponto
      let maxDistance = 0;
      let maxDistanceTime = null;

      for (const loc of locsDuringCheckin) {
        const distance = calculateDistance(
          Number(loc.latitude),
          Number(loc.longitude),
          projectLat,
          projectLng
        );
        if (distance > maxDistance) {
          maxDistance = distance;
          maxDistanceTime = loc.createdAt;
        }
      }

      console.log(`Distância máxima: ${Math.round(maxDistance)}m às ${maxDistanceTime?.toISOString()}`);

      if (maxDistance > 70) {
        console.log(`⚠️  SAIU DA ÁREA (>70m) - Deveria ter mostrado aviso!`);
      }
    }
  }
}

// Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // metros
  const toRad = (deg) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

main().catch(console.error).finally(() => prisma.$disconnect());
