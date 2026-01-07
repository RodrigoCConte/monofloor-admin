const { PrismaClient } = require('@prisma/client');
const zlib = require('zlib');
const prisma = new PrismaClient();

(async () => {
  // Pegar as 3 últimas gravações
  const recordings = await prisma.sessionRecording.findMany({
    orderBy: { startedAt: 'desc' },
    take: 3,
    select: { id: true, sessionId: true, eventsData: true, startedAt: true, eventsCount: true }
  });

  for (const rec of recordings) {
    console.log('\n=== Recording ===');
    console.log('Session:', rec.sessionId.substring(0, 8));
    console.log('Started:', rec.startedAt);

    const buffer = Buffer.from(rec.eventsData, 'base64');
    const json = zlib.gunzipSync(buffer).toString('utf-8');
    const events = JSON.parse(json);

    console.log('Total events:', events.length);

    // Analisar timestamps
    if (events.length > 0) {
      const first = events[0];
      const last = events[events.length - 1];
      const durationMs = last.timestamp - first.timestamp;
      console.log('Duration:', Math.round(durationMs / 1000), 'seconds');

      // Verificar gaps nos timestamps
      let lastTs = first.timestamp;
      let maxGap = 0;
      let gapAfterEvent = 0;

      for (let i = 1; i < events.length; i++) {
        const gap = events[i].timestamp - lastTs;
        if (gap > maxGap) {
          maxGap = gap;
          gapAfterEvent = i - 1;
        }
        lastTs = events[i].timestamp;
      }

      console.log('Max gap between events:', Math.round(maxGap / 1000), 'seconds (after event', gapAfterEvent, ')');

      // Mostrar tipos de eventos
      const typeCount = events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {});
      console.log('Event types:', JSON.stringify(typeCount));
    }
  }

  await prisma.$disconnect();
})();
