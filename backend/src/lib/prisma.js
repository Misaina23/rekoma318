let prisma;

const noOp = {
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  count: async () => 0,
  create: async (d) => d?.data ?? {},
  update: async (d) => d?.data ?? {},
  upsert: async (d) => d?.create ?? d?.update ?? {},
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
  updateMany: async () => ({ count: 0 }),
  aggregate: async () => ({}),
  groupBy: async () => [],
};

function createMockPrisma() {
  return new Proxy(
    {
      $connect: async () => {},
      $disconnect: async () => {},
      $queryRaw: async () => [],
      $executeRaw: async () => 0,
      $transaction: async (arg) => (typeof arg === 'function' ? arg(createMockPrisma()) : Promise.all(arg)),
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return noOp;
      },
    }
  );
}

try {
  const mod = await import('@prisma/client');
  if (mod?.PrismaClient && process.env.DATABASE_URL) {
    prisma = new mod.PrismaClient();
  } else {
    console.warn('[AI Studio] Database not connected — using mock');
    prisma = createMockPrisma();
  }
} catch {
  console.warn('[AI Studio] Database not connected — using mock');
  prisma = createMockPrisma();
}

export { prisma };
export default prisma;