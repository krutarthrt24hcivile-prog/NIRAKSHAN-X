import { app } from './app.js'; import { config } from './config.js'; import { prisma } from './utils/prisma.js';
const server=app.listen(config.port,()=>console.log(`NIRIKSHAN-X API listening on ${config.port}`));
const shutdown=async()=>{server.close();await prisma.$disconnect();process.exit(0)};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
