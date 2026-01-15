# Swagger API Demo Guide

This guide demonstrates how to use the CV Converter API with Swagger documentation.

## 🚀 Getting Started

1. **Setup the environment**:

   ```bash
   # Create .env file in apps/cv-converter-api/
   echo 'DATABASE_URL="postgresql://username:password@localhost:5432/cv_converter_db?schema=public"' > apps/cv-converter-api/.env
   echo 'NODE_ENV=development' >> apps/cv-converter-api/.env
   echo 'PORT=3000' >> apps/cv-converter-api/.env
   ```

2. **Start the server**:

   ```bash
   nx serve cv-converter-api
   ```

3. **Open Swagger UI**:
   Navigate to: `http://localhost:3000/api/docs`

## 📖 API Features

### Swagger Documentation Includes:

- **Interactive API Testing**: Try out endpoints directly from the browser
- **Request/Response Schemas**: Complete data structure documentation
- **Validation Rules**: See required fields and validation constraints
- **Example Payloads**: Pre-filled examples for easy testing

### Enhanced Features:

- **Input Validation**: Automatic validation using class-validator
- **Type Safety**: Full TypeScript support with Prisma integration
- **Error Handling**: Detailed error responses
- **API Versioning**: Global `/api` prefix for all endpoints

## 🧪 Testing the API

### 1. Create a User

```http
POST /api/users
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```

### 2. Get All Users

```http
GET /api/users
```

### 3. Get User by ID

```http
GET /api/users/{userId}
```

### 4. Update User

```http
PATCH /api/users/{userId}
Content-Type: application/json

{
  "name": "John Smith"
}
```

### 5. Delete User

```http
DELETE /api/users/{userId}
```

## 🔧 Validation Examples

The API includes comprehensive validation:

### Valid Request:

```json
{
  "email": "valid@example.com",
  "name": "Valid Name"
}
```

### Invalid Requests (will return 400 errors):

```json
// Invalid email
{
  "email": "invalid-email",
  "name": "John"
}

// Name too short
{
  "email": "valid@example.com",
  "name": "J"
}

// Extra properties (forbidden)
{
  "email": "valid@example.com",
  "name": "John",
  "invalidField": "not allowed"
}
```

## 🎯 Next Steps

1. Set up your PostgreSQL database
2. Run `npm run db:migrate` to create tables
3. Start testing with the Swagger UI
4. Expand the API with CV upload and conversion endpoints

## 💡 Pro Tips

- Use the **"Try it out"** button in Swagger UI for interactive testing
- Check the **Models** section at the bottom for complete schema definitions
- Use the **Authorization** section when you add authentication later
- Export API calls from Swagger to tools like Postman or curl
