# Project Structure Overview

## Complete Folder Structure

```
payroll-admin-backend/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── seeds/
│       └── createAdmin.ts         # Script to create initial super admin
├── src/
│   ├── config/
│   │   ├── db.ts                  # Prisma client configuration
│   │   └── jwt.ts                 # JWT configuration (secret, expiry)
│   ├── controllers/
│   │   ├── adminDashboard.controller.ts    # Dashboard stats endpoints
│   │   ├── adminUsers.controller.ts        # User management endpoints
│   │   ├── adminSubscriptions.controller.ts # Subscription endpoints
│   │   ├── adminSecurity.controller.ts     # Security monitoring endpoints
│   │   ├── adminAudit.controller.ts        # Audit log endpoints
│   │   └── adminRevenue.controller.ts      # Revenue analytics endpoints
│   ├── services/
│   │   ├── adminDashboard.service.ts       # Dashboard business logic
│   │   ├── adminUsers.service.ts           # User management logic
│   │   ├── adminSubscriptions.service.ts   # Subscription logic
│   │   ├── adminSecurity.service.ts        # Security monitoring logic
│   │   ├── adminAudit.service.ts           # Audit log logic
│   │   └── adminRevenue.service.ts         # Revenue analytics logic
│   ├── routes/
│   │   ├── admin.dashboard.routes.ts       # Dashboard route definitions
│   │   ├── admin.users.routes.ts           # User routes
│   │   ├── admin.subscriptions.routes.ts   # Subscription routes
│   │   ├── admin.security.routes.ts        # Security routes
│   │   ├── admin.audit.routes.ts           # Audit routes
│   │   └── admin.revenue.routes.ts         # Revenue routes
│   ├── middlewares/
│   │   ├── adminAuth.middleware.ts         # JWT + SUPER_ADMIN verification
│   │   ├── error.middleware.ts             # Global error handler
│   │   └── audit.middleware.ts             # Audit logging middleware
│   ├── utils/
│   │   ├── response.ts                     # Standard response helpers
│   │   └── pagination.ts                   # Pagination utilities
│   ├── types/
│   │   └── express.d.ts                    # TypeScript type extensions
│   ├── app.ts                              # Express app setup & middleware
│   └── server.ts                           # Server entry point
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── README.md                      # Project documentation
└── STRUCTURE.md                   # This file

```

## Architecture Layers

### 1. Routes Layer (`src/routes/`)
- Defines API endpoints
- Maps HTTP methods to controller functions
- Applies middleware (auth, audit logging)
- **Responsibility**: Route definition only

### 2. Controllers Layer (`src/controllers/`)
- Handles HTTP requests and responses
- Validates request data
- Calls service layer methods
- Formats and sends responses
- **Responsibility**: Request/Response handling

### 3. Services Layer (`src/services/`)
- Contains business logic
- Interacts with database via Prisma
- Performs data transformations
- Handles complex operations
- **Responsibility**: Business logic

### 4. Middlewares Layer (`src/middlewares/`)
- `adminAuth.middleware.ts`: Verifies JWT token and SUPER_ADMIN role
- `error.middleware.ts`: Catches and formats errors
- `audit.middleware.ts`: Logs admin actions to database
- **Responsibility**: Cross-cutting concerns

### 5. Configuration Layer (`src/config/`)
- Database connection setup
- JWT configuration
- Environment-specific settings
- **Responsibility**: Application configuration

### 6. Utilities Layer (`src/utils/`)
- Reusable helper functions
- Response formatters
- Pagination helpers
- **Responsibility**: Shared utilities

## Request Flow

```
Client Request
    ↓
Express App (app.ts)
    ↓
Rate Limiter
    ↓
Routes (admin.*.routes.ts)
    ↓
Auth Middleware (adminAuth.middleware.ts)
    ↓
Audit Middleware (audit.middleware.ts) [Optional]
    ↓
Controller (admin*.controller.ts)
    ↓
Service (admin*.service.ts)
    ↓
Prisma Client (config/db.ts)
    ↓
MySQL Database
    ↓
Service Layer
    ↓
Controller Layer
    ↓
Response to Client
```

## Module Responsibilities

### Dashboard Module
- System-wide statistics
- Real-time metrics
- Quick insights

### Users Module
- User listing and search
- User status management
- User activity monitoring

### Subscriptions Module
- Subscription overview
- Subscription analytics
- Plan distribution

### Security Module
- Security event logs
- Failed login tracking
- Suspicious activity monitoring

### Audit Module
- Admin action logs
- Historical activity
- Compliance reporting

### Revenue Module
- Revenue statistics
- Financial analytics
- Period-based reports

## Security Layers

1. **Helmet**: HTTP security headers
2. **CORS**: Cross-origin protection
3. **Rate Limiting**: DDoS protection
4. **JWT**: Token-based authentication
5. **Role Check**: SUPER_ADMIN only access
6. **Audit Logging**: Action tracking

## Database Models

### Admin
- Stores admin user credentials
- Role-based access control
- Timestamp tracking

### AuditLog
- Records all admin actions
- IP and user agent tracking
- Detailed action logs

## Environment Variables

Required environment variables:
- `NODE_ENV`: Environment mode
- `PORT`: Server port
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiry time
- `CORS_ORIGIN`: Allowed origins

## Next Steps (Implementation Phase)

1. Implement authentication endpoints (login, logout)
2. Add business logic to service files
3. Connect controllers to services
4. Implement pagination in list endpoints
5. Add data validation
6. Create database migrations
7. Implement proper error handling
8. Add request validation middleware
9. Create API tests
10. Add API documentation (Swagger/OpenAPI)
