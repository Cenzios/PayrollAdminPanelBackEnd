import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/admin.dashboard.routes';
import usersRoutes from './routes/admin.users.routes';
import subscriptionsRoutes from './routes/admin.subscriptions.routes';
import securityRoutes from './routes/admin.security.routes';
import auditRoutes from './routes/admin.audit.routes';
import revenueRoutes from './routes/admin.revenue.routes';
import { requireSuperAdmin } from './middlewares/requireSuperAdmin.middleware';

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/admin', limiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payroll Admin Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Admin Routes (Protected)
app.use('/api/admin/dashboard', dashboardRoutes); // Protected inside the route file
app.use('/api/admin/users', requireSuperAdmin, usersRoutes);
app.use('/api/admin/subscriptions', requireSuperAdmin, subscriptionsRoutes);
app.use('/api/admin/security', requireSuperAdmin, securityRoutes);
app.use('/api/admin/audit', requireSuperAdmin, auditRoutes);
app.use('/api/admin/revenue', requireSuperAdmin, revenueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
