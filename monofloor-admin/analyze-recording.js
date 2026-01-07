const { PrismaClient } = require('@prisma/client');
const zlib = require('zlib');
const prisma = new PrismaClient();

(async () => {
  const rec = await prisma.sessionRecording.findFirst({
    orderBy: { startedAt: 'desc' },
    select: { id: true, sessionId: true, eventsData: true, startedAt: true, eventsCount: true }
  });

  console.log('ID:', rec.id);
  console.log('Session:', rec.sessionId.substring(0, 8));
  console.log('Started:', rec.startedAt);
  console.log('Events count in DB:', rec.eventsCount);

  const buffer = Buffer.from(rec.eventsData, 'base64');
  const json = zlib.gunzipSync(buffer).toString('utf-8');
  const events = JSON.parse(json);

  console.log('Actual events:', events.length);
  const types = events.map(e => e.type);
  console.log('Has FullSnapshot (type 2):', types.includes(2));
  console.log('Has Meta (type 4):', types.includes(4));

  const typeCount = types.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  console.log('Types distribution:', JSON.stringify(typeCount));

  if (events.length > 0) {
    const first = events[0];
    const last = events[events.length - 1];
    console.log('First timestamp:', first.timestamp);
    console.log('Last timestamp:', last.timestamp);
    console.log('Duration (ms):', last.timestamp - first.timestamp);
    console.log('Duration (sec):', Math.round((last.timestamp - first.timestamp) / 1000));
  }

  await prisma.$disconnect();
})();
