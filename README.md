# Payroll Admin Backend

Production-ready Admin Panel Backend for a SaaS Payroll System built with Node.js, Express, TypeScript, Prisma, and JWT authentication.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
src/
 ├── app.ts                          # Express app configuration
 ├── server.ts                       # Server entry point
 ├── config/
 │    ├── db.ts                      # Prisma client configuration
 │    └── jwt.ts                     # JWT configuration
 ├── routes/
 │    ├── admin.dashboard.routes.ts  # Dashboard routes
 │    ├── admin.users.routes.ts      # User management routes
 │    ├── admin.subscriptions.routes.ts # Subscription routes
 │    ├── admin.security.routes.ts   # Security monitoring routes
 │    ├── admin.audit.routes.ts      # Audit log routes
 │    └── admin.revenue.routes.ts    # Revenue analytics routes
 ├── controllers/
 │    ├── adminDashboard.controller.ts
 │    ├── adminUsers.controller.ts
 │    ├── adminSubscriptions.controller.ts
 │    ├── adminSecurity.controller.ts
 │    ├── adminAudit.controller.ts
 │    └── adminRevenue.controller.ts
 ├── services/
 │    ├── adminDashboard.service.ts
 │    ├── adminUsers.service.ts
 │    ├── adminSubscriptions.service.ts
 │    ├── adminSecurity.service.ts
 │    ├── adminAudit.service.ts
 │    └── adminRevenue.service.ts
 ├── middlewares/
 │    ├── adminAuth.middleware.ts    # JWT authentication & SUPER_ADMIN check
 │    ├── error.middleware.ts        # Global error handling
 │    └── audit.middleware.ts        # Audit logging middleware
 ├── utils/
 │    ├── response.ts                # Standard response helpers
 │    └── pagination.ts              # Pagination utilities
 └── types/
      └── express.d.ts               # TypeScript type declarations
```

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mysql://user:password@localhost:3306/payroll_admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:3000
```

3. **Generate Prisma Client:**
```bash
npm run prisma:generate
```

4. **Run database migrations:**
```bash
npm run prisma:migrate
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Build & Production

Build the project:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## API Endpoints

All admin endpoints require:
- **Authentication**: Bearer token in Authorization header
- **Role**: SUPER_ADMIN

### Health Check
- `GET /health` - Server health check (public)

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Users
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/users/:id` - Get user by ID
- `PATCH /api/admin/users/:id/status` - Update user status

### Subscriptions
- `GET /api/admin/subscriptions` - Get all subscriptions
- `GET /api/admin/subscriptions/stats` - Get subscription statistics

### Security
- `GET /api/admin/security/logs` - Get security logs
- `GET /api/admin/security/failed-logins` - Get failed login attempts

### Audit Logs
- `GET /api/admin/audit` - Get audit logs (paginated)
- `GET /api/admin/audit/:id` - Get audit log by ID

### Revenue
- `GET /api/admin/revenue/stats` - Get revenue statistics
- `GET /api/admin/revenue/period` - Get revenue by period

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The token must contain:
- Valid signature
- Non-expired timestamp
- Role = SUPER_ADMIN

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: SUPER_ADMIN only access
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Audit Logging**: All admin actions are logged
- **Request Validation**: Input sanitization and validation

## Database Schema

### Admin
- `id`: UUID (Primary Key)
- `email`: Unique email address
- `password`: Hashed password
- `role`: Admin role (SUPER_ADMIN)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### AuditLog
- `id`: UUID (Primary Key)
- `adminId`: Foreign key to Admin
- `action`: Action performed
- `resource`: Resource affected
- `details`: JSON details
- `ipAddress`: IP address
- `userAgent`: User agent string
- `timestamp`: Timestamp

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## Important Notes

⚠️ **Internal Use Only**: This admin panel is for system owners only

⚠️ **Privacy**: Does not expose personal employee salary data

⚠️ **Security**: All endpoints require SUPER_ADMIN authentication

⚠️ **Audit Trail**: All admin actions are automatically logged

## License

ISC
