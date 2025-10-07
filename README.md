# Dashboard Demo - Backend API

Professional REST API for a Dashboard CRM built with Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

-   Node.js 20+
-   PostgreSQL 14+
-   npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and configure your database
# Update DATABASE_URL with your PostgreSQL credentials

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

### Development

```bash
# Start development server (with auto-reload)
npm run dev

# The server will run on http://localhost:5000
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication via JWT token.

Token can be sent via:

-   Cookie: `token` (httpOnly)
-   Header: `Authorization: Bearer <token>`

#### Endpoints

**POST /api/auth/register**

```json
{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
}
```

**POST /api/auth/login**

```json
{
    "email": "user@example.com",
    "password": "Password123!"
}
```

**POST /api/auth/logout**

-   No body required

**GET /api/auth/me**

-   Returns current user profile

### Users (Admin Only)

**GET /api/users**

-   Query params: `page`, `limit`, `search`, `sortBy`, `order`

**GET /api/users/:id**

-   Get user by ID

**GET /api/users/:id/stats**

-   Get user statistics

**POST /api/users**

```json
{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe",
    "role": "USER"
}
```

**PUT /api/users/:id**

```json
{
    "name": "Jane Doe",
    "email": "jane@example.com"
}
```

**DELETE /api/users/:id**

-   Delete user

### Products

**GET /api/products**

-   Query params: `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`, `status`, `sortBy`, `order`

**GET /api/products/:id**

-   Get product by ID with sales data

**POST /api/products**

```json
{
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "cost": 50.0,
    "stock": 100,
    "categoryId": "uuid",
    "sku": "PROD-001"
}
```

**PUT /api/products/:id**

```json
{
    "name": "Updated Name",
    "price": 89.99,
    "stock": 150
}
```

**DELETE /api/products/:id**

-   Delete product

**GET /api/products/categories/all**

-   Get all categories with product counts

**POST /api/products/categories** (Admin Only)

```json
{
    "name": "Category Name",
    "slug": "category-slug"
}
```

### Analytics

**GET /api/analytics/stats**

-   Get dashboard KPIs (total users, products, revenue, growth rates)

**GET /api/analytics/sales**

-   Query params: `months` (default: 12)
-   Get sales data by month

**GET /api/analytics/categories**

-   Get revenue breakdown by category

**GET /api/analytics/top-products**

-   Query params: `limit` (default: 10)
-   Get top products by revenue

**GET /api/analytics/activity**

-   Query params: `limit` (default: 10)
-   Get recent sales, products, and users

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database (warning: deletes all data)
npm run prisma:reset
```

## 🔒 Security Features

-   JWT authentication with httpOnly cookies
-   Password hashing with bcrypt (12 salt rounds)
-   Rate limiting (100 requests per 15 minutes)
-   Auth rate limiting (5 login attempts per 15 minutes)
-   Helmet.js for security headers
-   CORS configuration
-   Input validation with Zod
-   SQL injection protection via Prisma

## 🏗️ Project Structure

```
src/
├── config/           # Database and environment config
├── controllers/      # Request handlers
├── middleware/       # Auth, validation, error handling
├── routes/           # API route definitions
├── services/         # Business logic
├── types/            # TypeScript type definitions
├── utils/            # Helpers and validators
├── app.ts            # Express app configuration
└── server.ts         # Server entry point

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Database seeding script
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Environment Variables

See `.env.example` for all required variables:

-   `DATABASE_URL` - PostgreSQL connection string
-   `PORT` - Server port (default: 5000)
-   `NODE_ENV` - Environment (development/production)
-   `JWT_SECRET` - Secret key for JWT (min 32 chars)
-   `JWT_EXPIRES_IN` - Token expiration (e.g., 7d)
-   `FRONTEND_URL` - Frontend URL for CORS

## 🚀 Deployment

### Using Docker (TODO)

```bash
docker build -t dashboard-backend .
docker run -p 5000:5000 dashboard-backend
```

### Manual Deployment

1. Set environment variables
2. Run `npm run build`
3. Run `npm run prisma:migrate`
4. Run `npm start`

## 📈 Performance

-   Prisma connection pooling
-   Index optimization on frequently queried fields
-   Pagination for large datasets
-   Efficient aggregation queries for analytics

## 🤝 Contributing

This is a portfolio project. Feel free to fork and customize!

## 📄 License

MIT

---

**Made with ❤️ for demonstrating full-stack development skills**
