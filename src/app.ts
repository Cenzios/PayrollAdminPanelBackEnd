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
import companiesRoutes from './routes/admin.companies.routes';
import subscriptionsRoutes from './routes/admin.subscriptions.routes';
import plansRoutes from './routes/admin.plans.routes';
import securityRoutes from './routes/admin.security.routes';
import auditRoutes from './routes/admin.audit.routes';
import revenueRoutes from './routes/admin.revenue.routes';
import profileRoutes from './routes/admin.profile.routes';
import settingsRoutes from './routes/admin.settings.routes';
import notificationsRoutes from './routes/admin.notifications.routes';
import manualPaymentsRoutes from './routes/admin.manualpayments.routes';
import { requireSuperAdmin } from './middlewares/requireSuperAdmin.middleware';

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());

// Support multiple comma-separated origins: e.g. CORS_ORIGIN=https://qa.example.com,https://prod.example.com
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // If no CORS_ORIGIN set, allow all
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin '${origin}' is not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/admin', limiter);

app.get('/health', (_req, res) => {
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
app.use('/api/admin/users', usersRoutes); // Protected inside the route file
app.use('/api/admin/companies', companiesRoutes); // Protected inside the route file
app.use('/api/admin/subscriptions', subscriptionsRoutes); // Protected inside the route file
app.use('/api/admin/plans', plansRoutes); // Protected inside the route file
app.use('/api/admin/security', requireSuperAdmin, securityRoutes);
app.use('/api/admin/audit', requireSuperAdmin, auditRoutes);
app.use('/api/admin/revenue', revenueRoutes); // Protected inside the route file
app.use('/api/admin/profile', profileRoutes); // Protected inside the route file
app.use('/api/admin/settings', settingsRoutes); // Protected inside the route file
app.use('/api/admin/notifications', notificationsRoutes); // Protected inside the route file
app.use('/api/admin/manual-payments', manualPaymentsRoutes); // Will add protection inside the route file if needed

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

//pathum
