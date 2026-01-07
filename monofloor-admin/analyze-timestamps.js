const { PrismaClient } = require('@prisma/client');
const zlib = require('zlib');
const prisma = new PrismaClient();

(async () => {
  const rec = await prisma.sessionRecording.findFirst({
    orderBy: { startedAt: 'desc' },
    select: { eventsData: true }
  });

  const buffer = Buffer.from(rec.eventsData, 'base64');
  const json = zlib.gunzipSync(buffer).toString('utf-8');
  const events = JSON.parse(json);

  console.log('Analisando', events.length, 'eventos:\n');

  // Mostrar os primeiros e últimos eventos com timestamps
  console.log('=== Primeiros 10 eventos ===');
  for (let i = 0; i < Math.min(10, events.length); i++) {
    const e = events[i];
    const date = new Date(e.timestamp);
    console.log(`Event ${i}: type=${e.type}, ts=${e.timestamp}, time=${date.toISOString()}`);
  }

  console.log('\n=== Últimos 10 eventos ===');
  for (let i = Math.max(0, events.length - 10); i < events.length; i++) {
    const e = events[i];
    const date = new Date(e.timestamp);
    const prevTs = i > 0 ? events[i-1].timestamp : e.timestamp;
    const gap = e.timestamp - prevTs;
    console.log(`Event ${i}: type=${e.type}, ts=${e.timestamp}, time=${date.toISOString()}, gap=${gap}ms`);
  }

  // Encontrar onde estão os gaps grandes
  console.log('\n=== Gaps > 1 segundo ===');
  for (let i = 1; i < events.length; i++) {
    const gap = events[i].timestamp - events[i-1].timestamp;
    if (gap > 1000) {
      console.log(`Gap de ${Math.round(gap/1000)}s entre evento ${i-1} (type=${events[i-1].type}) e ${i} (type=${events[i].type})`);
    }
  }

  await prisma.$disconnect();
})();
