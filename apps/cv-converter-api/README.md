# CV Converter API

This is the backend API for the CV Converter application, built with NestJS and Prisma.

## Setup

### 1. Environment Configuration

Create a `.env` file in the `apps/cv-converter-api` directory with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/cv_converter_db?schema=public"
NODE_ENV=development
PORT=3000
```

### 2. Database Setup

Make sure you have PostgreSQL running, then run:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 3. Development

```bash
# Start the API server
nx serve cv-converter-api

# Or start both frontend and backend
npm run start:all
```

## API Documentation

The API includes **Swagger/OpenAPI** documentation for interactive API testing and exploration.

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Base API URL**: `http://localhost:3000/api`

### Features:

- Interactive API testing interface
- Comprehensive endpoint documentation
- Request/response schema definitions
- Example payloads for all operations

## Available API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### CVs (Future endpoints)

- `GET /api/cvs` - Get all CVs
- `POST /api/cvs` - Upload and convert CV
- `GET /api/cvs/:id` - Get CV by ID
- `PATCH /api/cvs/:id` - Update CV status

## Database Schema

The application includes these models:

- **User**: User information with email and name
- **CV**: CV documents linked to users with conversion status

## Useful Commands

```bash
# Reset database
npm run db:reset

# Generate Prisma client after schema changes
npm run db:generate

# Create and apply new migration
npm run db:migrate

# Open Swagger documentation
# Navigate to http://localhost:3000/api/docs after starting the server
```
