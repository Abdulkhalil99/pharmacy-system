import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loggerMiddleware } from './middleware/logger.middleware';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';
import { prisma } from './utils/prismaClient';
import authRouter from './routes/auth.routes';
import companyRouter from './routes/company.routes';
import medicineRouter from './routes/medicine.routes';
import saleRouter from './routes/sale.routes';
import cashRegisterRouter from './routes/cashregister.routes';
import customerRouter from './routes/customer.routes';
import expenseRouter from './routes/expense.routes';
import salaryRouter from './routes/salary.routes';
import reportRouter from './routes/report.routes';
import userRouter from './routes/user.routes';
import employeeRouter from './routes/employee.routes';

// ─── Validate Environment ────────────────────────────────────────────────────
if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  console.error('❌ Missing required env var: DATABASE_URL or DIRECT_URL');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Missing required env var: JWT_SECRET');
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT ?? '5000', 10);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  })
);

// ─── Parsing ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(loggerMiddleware);

// ─── Health Check ─────────────────────────────────────────────────────────────
// No auth required — used by deployment platforms to check if server is alive.
// Also checks database connectivity so you know both layers are healthy.
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        status: 'ok',
        database: 'connected',
        environment: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      data: {
        status: 'degraded',
        database: 'disconnected',
      },
    });
  }
});

app.use('/api/auth', authRouter);

app.use('/api/companies', companyRouter);

app.use('/api/customers', customerRouter);

app.use('/api/expenses', expenseRouter);

app.use('/api/salaries', salaryRouter);

app.use('/api/users', userRouter);

app.use('/api/employees', employeeRouter);

app.use('/api/medicines', medicineRouter);

app.use('/api/sales', saleRouter);

app.use('/api/cash', cashRegisterRouter);

app.use('/api/reports', reportRouter);

// ─── Error Handling (must be LAST) ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🏥 Pharmacy API Ready            ║
╠════════════════════════════════════╣
║  Port : ${PORT}                       ║
║  Mode : ${(process.env.NODE_ENV ?? 'development').padEnd(11)}          ║
║  DB   : Neon PostgreSQL            ║
╚════════════════════════════════════╝
  `);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// When the server is stopped (Ctrl+C or deployment restart), close open
// connections cleanly instead of cutting them off mid-request.
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Database disconnected. Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
