const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Handle connection errors
prisma.$connect()
  .then(() => console.log('✓ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error));

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
