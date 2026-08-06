# School & Inventory Management System (SMS) Backend

A production-grade, multi-tenant SaaS School and Inventory Management System (SMS/EMS) backend built with Node.js, Express, TypeScript, Prisma ORM, Neon PostgreSQL, Redis, and WebSockets.

---

## Key Features

### Multi-Tenancy (SaaS Architecture)

- **SuperAdmin Panel:** Overarching control over the platform, administrative oversight of Admins, Company registration, status approvals, manual subscription updates, and billing payments.
- **Admin Panel (Tenant Owners):** Create and manage Companies, onboard and supervise Staff, assign specific roles, manage billing subscriptions.
- **Staff (Role-Based Permissions):** Roles include `MANAGER`, `ACCOUNTANT`, `RECEPTIONIST`, and `INSTRUCTOR` with granular permissions (`SMS` and `INVENTORY`) to secure critical resources.

### Authentication & Session Management

- Multi-device session tracking (`Session` model tracking IP address, User-Agent, and token revocation).
- Single-device and all-device logout (`/logout` and `/logout-all`).
- Automatic OTP email verification and password resets using **Resend**.
- JWT Authentication (Access and Refresh tokens).
- Blacklisted tokens for revocation using Redis for real time security.

### Student & Academic Management

- **Course & Batch Scheduling:** Manage available educational courses, custom batches, student capacities, and start dates.
- **Student Enrollment:** Dynamic profiling, status triggers, linking students to courses/batches inside specific companies.

### Fees & Payment Processing

- Structured Fee Accounts for students.
- Supports Fixed and Percentage discounts.
- Payment structures: `INSTALLMENT`, `ADVANCED`, and `FULL`.
- Log payments, remaining fee calculations, and transaction histories.

### Inventory & Stock Control

- Comprehensive inventory lists with detailed Stock Keeping Units (SKU) and Unit of Measure (UOM) types (e.g. `PIECE`, `BOX`, `PACK`, `DOZEN`, `KILOGRAM`).
- Batch tracking (`InventoryBatch`) capturing purchase prices, suppliers, and expiration dates.
- Supplier management.
- Stock movements log (`StockHistory`) with movement types (`IN`, `OUT`, `ADJUSTMENT`) and reasons (`PURCHASE`, `ISSUE`, `RETURN`, `DAMAGE`, `LOST`, `MANUAL_ADJUSTMENT`).
- Automatic updates to main inventory quantities and low-stock alerts.

### Subscription & Billing

- SaaS subscription statuses: `TRIAL`, `PAID`, `EXPIRED`, `CANCELLED`.
- Verification of payments via bank transfer, QR, cash, or cheques.
- Automated scheduler to trigger notifications and disable services upon subscription expiry.

### Background Jobs & Schedulers

- Automated cleanup of unverified admins.
- Subscription monitoring and reminder emails.

### Real-Time Communications

- Integration with Socket.io for immediate alerts and internal notifications.

### API Documentation

- Fully documented interactive API endpoint catalog via Swagger UI. Accessible at `/sms/docs`.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express (with TypeScript)
- **Database ORM:** Prisma ORM
- **Database Engine:** PostgreSQL (neon)
- **Caching & Session Storage:** Redis Cloud
- **E-mail Service:** Resend API
- **Real-Time updates:** Socket.io
- **Logger:** Winston (with Daily File Rotation)
- **Validation:** Zod schemas
- **Doc Gen:** Swagger / `@asteasolutions/zod-to-openapi`

---

## Project Architecture

```
sms_backend/
├── prisma/
│   ├── schema.prisma           # Prisma DB schema & relational modeling
│   └── seed.ts                 # Database seeding (SuperAdmin setup)
├── src/
│   ├── app.ts                  # Express Application configuration and middlewares
│   ├── server.ts               # HTTP and WebSockets Server entry point
│   ├── config/                 # Redis, Prisma, Env, and Logger configurations
│   ├── controller/             # Request handlers (auth, admin, students, inventory, etc.)
│   ├── docs/                   # Swagger OpenAPI configuration & Zod-to-OpenAPI registry
│   ├── dto/                    # Data Transfer Objects
│   ├── jobs/                   # Background Cron Schedulers
│   ├── middlewares/            # Auth guards, Role & Permission filters, Error handler
│   ├── routes/                 # Express Route controllers (auth, admins, super-admin, company)
│   ├── schemas/                # Zod schemas for input validation & response mappings
│   ├── service/                # Business logic (e.g., Email service, Realtime notifications)
│   ├── socket/                 # Socket.io handlers, store, and server connection
│   ├── types/                  # TypeScript custom type files
│   └── utils/                  # Helper utilities (AppError, JWT tokens, hashes, generators)
```

---

## Database Models & Relations (Prisma Summary)

Here is a conceptual layout of the key models defined in `prisma/schema.prisma`:

- **SuperAdmin**: System-wide platform controller.
- **Admin**: Tenants who register a `Company`.
- **Company**: Main organizational hub. Owns `Staff`, `Students`, `Courses`, `Batches`, `Payments`, `Inventory`, and `Subscriptions`.
- **Staff**: Company employees with role configurations and granular permissions.
- **Student**: Enrolled in a `Company`, linked to a `Batch` and `Course`, having a `FeeAccount` and multiple `Payments`.
- **Inventory**: Store tracking, linking to `InventoryBatch` (supplied by `Supplier`) and `StockHistory`.
- **Subscription**: Controls SaaS system access levels.

---

## Getting Started & Setup

### Prerequisites

Make sure you have the following installed on your machine:

- Node.js (v18 or higher recommended)
- PostgreSQL Database
- Redis Server

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd sms_backend
   ```

2. **Install all dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and configure the variables as follows:

   ```env
   # General config
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # Database settings
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_USERNAME=default
   REDIS_PASSWORD=your_redis_password

   # Email service
   RESEND_API_KEY=re_your_resend_api_key

   # SuperAdmin Seeding & Admin setup
   SUPERADMIN_FULLNAME="Super Admin"
   SUPERADMIN_EMAIL="[EMAIL_ADDRESS]"
   SUPERADMIN_PASSWORD="your_password"
   SUPERADMIN_PHONE="[NUMBER]"

   # JWT configurations
   JWT_ACCESS_SECRET="your_admin_access_token_secret"
   JWT_REFRESH_SECRET="your_admin_refresh_token_secret"
   ACCESS_TOKEN_EXPIRY="15m"
   REFRESH_TOKEN_EXPIRY="7d"

   SUPERADMIN_JWT_ACCESS_SECRET="your_superadmin_access_token_secret"
   SUPERADMIN_JWT_ACCESS_EXPIRY="2h"
   ```

4. **Initialize Prisma & Apply Migrations:**

   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

6. **Seed SuperAdmin Account:**

   ```bash
   npm run build
   npx prisma db seed
   ```

7. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## API Documentation & Swagger

Once the server is running, you can access the full interactive Swagger API playground at:
`http://localhost:3000/sms/docs`

This documentation contains detailed request validation requirements (via Zod schemas) and mock responses for all authentication, company, billing, and student routes.
