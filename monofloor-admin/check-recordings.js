const { PrismaClient } = require('@prisma/client');
const zlib = require('zlib');
const prisma = new PrismaClient();

(async () => {
  const recordings = await prisma.sessionRecording.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { sessionId: true, eventsData: true, startedAt: true }
  });

  for (const rec of recordings) {
    const buffer = Buffer.from(rec.eventsData, 'base64');
    const json = zlib.gunzipSync(buffer).toString('utf-8');
    const events = JSON.parse(json);
    const types = events.map(e => e.type);
    const hasType2 = types.includes(2);
    const hasType4 = types.includes(4);
    console.log(rec.sessionId.substring(0,8), '| Events:', events.length, '| FullSnapshot:', hasType2, '| Meta:', hasType4, '| Started:', rec.startedAt);
  }

  await prisma.$disconnect();
})();
